const http = require("http");
const { randomUUID } = require("crypto");

const { MENU_PRODUCTS } = require("./data/menu");
const { badRequest, json, notFound, readJson } = require("./lib/http");
const { sendInviteEmail } = require("./lib/ses");
const { sendExpoPush } = require("./lib/push");
const { computeSummary } = require("./lib/summary");
const { isValidEmail, normalizeEmail } = require("./lib/validators");
const { createGroup, getGroup, saveGroup } = require("./lib/store");

const PORT = Number(process.env.PORT || 3001);

const MAX_QTY_PER_ITEM = Number(process.env.MAX_QTY_PER_ITEM || 10);

/** @type {Map<string, string>} */
const pushTokensByEmail = new Map();

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) return notFound(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;

    if (req.method === "GET" && path === "/health") {
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && path === "/menu") {
      return json(res, 200, { products: MENU_PRODUCTS });
    }

    if (req.method === "POST" && path === "/push/register") {
      const body = await readJson(req);
      const email = normalizeEmail(body.email);
      const token = String(body.token || "").trim();
      if (!isValidEmail(email)) return badRequest(res, "Invalid email");
      if (!token) return badRequest(res, "Invalid token");
      pushTokensByEmail.set(email, token);
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && path === "/groups") {
      const body = await readJson(req);
      const hostEmail = normalizeEmail(body.hostEmail);
      if (!isValidEmail(hostEmail)) return badRequest(res, "Invalid hostEmail");

      const groupId = randomUUID();
      const group = {
        id: groupId,
        hostEmail,
        invitedEmails: [],
        joinedEmails: [hostEmail],
        cartsByEmail: { [hostEmail]: {} },
        createdAt: Date.now(),
        checkedOutAt: null,
      };
      await createGroup(group);
      return json(res, 200, { group });
    }

    const groupIdMatch = path.match(/^\/groups\/([^/]+)(?:\/(.+))?$/);
    if (groupIdMatch) {
      const groupId = groupIdMatch[1];
      const action = groupIdMatch[2] || "";
      const group = await getGroup(groupId);
      if (!group) return json(res, 404, { error: "group_not_found" });

      if (req.method === "GET" && action === "") {
        return json(res, 200, { group, summary: computeSummary(group) });
      }

      if (req.method === "POST" && action === "join") {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        if (!isValidEmail(email)) return badRequest(res, "Invalid email");

        const participants = [group.hostEmail, ...group.invitedEmails];
        if (!participants.includes(email))
          return badRequest(res, "Unknown participant email");

        group.joinedEmails = Array.isArray(group.joinedEmails)
          ? group.joinedEmails
          : [];
        if (!group.joinedEmails.includes(email)) group.joinedEmails.push(email);
        await saveGroup(group);
        return json(res, 200, { group, summary: computeSummary(group) });
      }

      if (req.method === "POST" && action === "invite") {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        if (!isValidEmail(email)) return badRequest(res, "Invalid email");
        if (email === group.hostEmail)
          return badRequest(res, "Host is already in the group");
        if (group.invitedEmails.includes(email))
          return badRequest(res, "That email is already invited");
        if (group.invitedEmails.length >= 2)
          return badRequest(res, "Group is capped at 3 total participants");

        group.invitedEmails.push(email);
        group.cartsByEmail[email] = group.cartsByEmail[email] || {};

        const inviteToken = pushTokensByEmail.get(email);
        if (inviteToken) {
          try {
            await sendExpoPush({
              to: inviteToken,
              title: "GoDash invite",
              body: `You were invited by ${group.hostEmail}`,
              data: { groupId: group.id, hostEmail: group.hostEmail },
            });
          } catch (e) {
            console.error(
              "[push] failed to send invite push",
              e instanceof Error ? e.message : String(e),
            );
          }
        }

        try {
          await sendInviteEmail({
            toEmail: email,
            hostEmail: group.hostEmail,
            groupId: group.id,
          });
        } catch (e) {
          console.error(
            "[SES] failed to send invite email",
            e instanceof Error ? e.message : String(e),
          );
        }
        await saveGroup(group);
        return json(res, 200, { group, summary: computeSummary(group) });
      }

      if (req.method === "DELETE" && action === "invite") {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        group.invitedEmails = group.invitedEmails.filter((e) => e !== email);
        if (Array.isArray(group.joinedEmails)) {
          group.joinedEmails = group.joinedEmails.filter((e) => e !== email);
        }
        delete group.cartsByEmail[email];
        await saveGroup(group);
        return json(res, 200, { group, summary: computeSummary(group) });
      }

      if (req.method === "POST" && action === "cart") {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        const productId = String(body.productId || "");
        const delta = Number(body.delta || 0);

        const participants = [group.hostEmail, ...group.invitedEmails];
        if (!participants.includes(email))
          return badRequest(res, "Unknown participant email");
        if (!MENU_PRODUCTS.some((p) => p.id === productId))
          return badRequest(res, "Unknown productId");
        if (!Number.isFinite(delta) || delta === 0)
          return badRequest(res, "Invalid delta");

        const cart = group.cartsByEmail[email] || {};
        const currentQty = Number(cart[productId] || 0);
        const nextQty = Math.max(0, currentQty + delta);

        if (Number.isFinite(MAX_QTY_PER_ITEM) && MAX_QTY_PER_ITEM > 0) {
          if (nextQty > MAX_QTY_PER_ITEM)
            return badRequest(
              res,
              `Max quantity per item is ${MAX_QTY_PER_ITEM}`,
            );
        }

        if (nextQty === 0) delete cart[productId];
        else cart[productId] = nextQty;
        group.cartsByEmail[email] = cart;
        await saveGroup(group);
        return json(res, 200, { group, summary: computeSummary(group) });
      }

      if (req.method === "POST" && action === "checkout") {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        if (email !== group.hostEmail)
          return json(res, 403, {
            error: "forbidden",
            message: "Only host can checkout",
          });

        const summary = computeSummary(group);
        if (!summary.totalCents || summary.totalCents <= 0)
          return badRequest(res, "Cannot checkout with an empty order");

        group.checkedOutAt = Date.now();
        await saveGroup(group);
        return json(res, 200, { group, summary });
      }

      return notFound(res);
    }

    return notFound(res);
  } catch (_e) {
    return json(res, 500, { error: "internal_error" });
  }
});

server.listen(PORT, () => {
  console.log(`backend listening on http://localhost:${PORT}`);
});
