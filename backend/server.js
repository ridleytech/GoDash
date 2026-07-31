const http = require("http");
const { randomUUID } = require("crypto");

const { MENU_PRODUCTS } = require("./data/menu");
const { badRequest, json, notFound, readJson } = require("./lib/http");
const { sendInviteEmail } = require("./lib/ses");
const { computeSummary } = require("./lib/summary");
const { isValidEmail, normalizeEmail } = require("./lib/validators");

const PORT = Number(process.env.PORT || 3001);

/** @type {Map<string, any>} */
const groups = new Map();

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

    if (req.method === "POST" && path === "/groups") {
      const body = await readJson(req);
      const hostEmail = normalizeEmail(body.hostEmail);
      if (!isValidEmail(hostEmail)) return badRequest(res, "Invalid hostEmail");

      const groupId = randomUUID();
      const group = {
        id: groupId,
        hostEmail,
        invitedEmails: [],
        cartsByEmail: { [hostEmail]: {} },
        createdAt: Date.now(),
        checkedOutAt: null,
      };
      groups.set(groupId, group);
      return json(res, 200, { group });
    }

    const groupIdMatch = path.match(/^\/groups\/([^/]+)(?:\/(.+))?$/);
    if (groupIdMatch) {
      const groupId = groupIdMatch[1];
      const action = groupIdMatch[2] || "";
      const group = groups.get(groupId);
      if (!group) return json(res, 404, { error: "group_not_found" });

      if (req.method === "GET" && action === "") {
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
        return json(res, 200, { group, summary: computeSummary(group) });
      }

      if (req.method === "DELETE" && action === "invite") {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        group.invitedEmails = group.invitedEmails.filter((e) => e !== email);
        delete group.cartsByEmail[email];
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
        if (nextQty === 0) delete cart[productId];
        else cart[productId] = nextQty;
        group.cartsByEmail[email] = cart;

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
        group.checkedOutAt = Date.now();
        return json(res, 200, { group, summary: computeSummary(group) });
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
