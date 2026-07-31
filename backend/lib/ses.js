const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const AWS_REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || "";
const SES_SEND_INVITES =
  (process.env.SES_SEND_INVITES || "false").toLowerCase() === "true";

let sesClient = null;
function getSesClient() {
  if (!sesClient) sesClient = new SESClient({ region: AWS_REGION });
  return sesClient;
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendInviteEmail({ toEmail, hostEmail, groupId }) {
  if (!SES_SEND_INVITES) return;
  if (!SES_FROM_EMAIL) return;
  if (!toEmail) return;

  const subject = `You\'re invited to a GoDash group order`;
  const text = [
    `You\'ve been invited to a GoDash group order.`,
    "",
    `Host: ${hostEmail}`,
    `Group ID: ${groupId}`,
    "",
    "Open the app to join and start adding items to your cart.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.4">
      <h2 style="margin:0 0 12px 0">You\'re invited to a GoDash group order</h2>
      <div><strong>Host:</strong> ${escapeHtml(hostEmail)}</div>
      <div><strong>Group ID:</strong> ${escapeHtml(groupId)}</div>
      <div style="margin-top:12px">Open the app to join and start adding items to your cart.</div>
    </div>
  `.trim();

  const cmd = new SendEmailCommand({
    Source: `GoDash <${SES_FROM_EMAIL}>`,
    Destination: { ToAddresses: [String(toEmail)] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: text, Charset: "UTF-8" },
        Html: { Data: html, Charset: "UTF-8" },
      },
    },
  });

  await getSesClient().send(cmd);
}

module.exports = {
  AWS_REGION,
  SES_FROM_EMAIL,
  SES_SEND_INVITES,
  sendInviteEmail,
};
