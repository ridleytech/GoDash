const fs = require("node:fs");

let firebaseAdmin = null;
let firebaseMessaging = null;

function getFirebaseMessaging() {
  if (firebaseMessaging) return firebaseMessaging;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "";
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";

  if (!serviceAccountPath && !serviceAccountJson) return null;

  // Lazy require so backend can still start without firebase-admin configured.
  // eslint-disable-next-line global-require
  firebaseAdmin = require("firebase-admin");

  if (firebaseAdmin.apps.length === 0) {
    let creds;
    if (serviceAccountJson) {
      creds = JSON.parse(serviceAccountJson);
    } else {
      creds = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    }

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(creds),
    });
  }

  firebaseMessaging = firebaseAdmin.messaging();
  return firebaseMessaging;
}

async function sendFcmPush({ to, title, body, data }) {
  const messaging = getFirebaseMessaging();
  if (!messaging) return;
  if (typeof to !== "string" || !to.trim()) return;

  const message = {
    token: to,
    notification: {
      title: title || "",
      body: body || "",
    },
    data: Object.fromEntries(
      Object.entries(data || {}).map(([k, v]) => [k, String(v)]),
    ),
  };

  return messaging.send(message);
}

module.exports = {
  sendFcmPush,
};
