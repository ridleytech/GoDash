const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function isExpoPushToken(token) {
  return typeof token === "string" && token.startsWith("ExponentPushToken[");
}

async function sendExpoPush({ to, title, body, data }) {
  if (!isExpoPushToken(to)) return;

  const message = {
    to,
    sound: "default",
    title,
    body,
    data: data || {},
  };

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (json && json.errors && json.errors[0] && json.errors[0].message) ||
      "Failed to send push";
    throw new Error(msg);
  }

  return json;
}

module.exports = {
  sendExpoPush,
};
