import messaging from "@react-native-firebase/messaging";
import * as Device from "expo-device";

export async function registerForPushNotificationsAsync(): Promise<
  { ok: true; token: string } | { ok: false; reason: string }
> {
  if (!Device.isDevice) {
    return {
      ok: false,
      reason: "Push notifications require a physical device.",
    };
  }

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) {
      return { ok: false, reason: "Notification permission not granted." };
    }

    const token = await messaging().getToken();
    if (!token) return { ok: false, reason: "Failed to get FCM token." };
    return { ok: true, token };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Failed to register for push.",
    };
  }
}
