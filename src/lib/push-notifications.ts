import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

function getExpoProjectId(): string | undefined {
  const anyConstants = Constants as unknown as {
    expoConfig?: { extra?: { eas?: { projectId?: string } } };
    easConfig?: { projectId?: string };
  };

  return (
    anyConstants.easConfig?.projectId ||
    anyConstants.expoConfig?.extra?.eas?.projectId
  );
}

export async function registerForPushNotificationsAsync(): Promise<
  | { ok: true; token: string }
  | { ok: false; reason: string }
> {
  if (!Device.isDevice) {
    return { ok: false, reason: "Push notifications require a physical device." };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return { ok: false, reason: "Notification permission not granted." };
  }

  const projectId = getExpoProjectId();
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return { ok: true, token: token.data };
}
