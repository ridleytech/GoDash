export type BackendProduct = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
};

export type BackendGroup = {
  id: string;
  hostEmail: string;
  invitedEmails: string[];
  joinedEmails?: string[];
  cartsByEmail: Record<string, Record<string, number>>;
  createdAt: number;
  checkedOutAt: number | null;
};

export type BackendSummary = {
  participants: string[];
  breakdown: {
    email: string;
    cart: Record<string, number>;
    subtotalCents: number;
  }[];
  totalCents: number;
};

export function getBackendBaseUrl() {
  const value = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!value) {
    throw new Error(
      "Missing EXPO_PUBLIC_BACKEND_URL. Create a .env file and set EXPO_PUBLIC_BACKEND_URL, e.g. http://localhost:3001",
    );
  }
  return value;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof json?.message === "string" ? json.message : "Request failed";
    throw new Error(message);
  }
  return json as T;
}

export async function backendHealth() {
  return request<{ ok: boolean }>("/health");
}

export async function backendMenu() {
  return request<{ products: BackendProduct[] }>("/menu");
}

export async function backendCreateGroup(hostEmail: string) {
  return request<{ group: BackendGroup }>("/groups", {
    method: "POST",
    body: JSON.stringify({ hostEmail }),
  });
}

export async function backendGetGroup(groupId: string) {
  return request<{ group: BackendGroup; summary: BackendSummary }>(
    `/groups/${groupId}`,
  );
}

export async function backendInvite(groupId: string, email: string) {
  return request<{ group: BackendGroup; summary: BackendSummary }>(
    `/groups/${groupId}/invite`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function backendRemoveInvite(groupId: string, email: string) {
  return request<{ group: BackendGroup; summary: BackendSummary }>(
    `/groups/${groupId}/invite`,
    {
      method: "DELETE",
      body: JSON.stringify({ email }),
    },
  );
}

export async function backendJoinGroup(groupId: string, email: string) {
  return request<{ group: BackendGroup; summary: BackendSummary }>(
    `/groups/${groupId}/join`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function backendCartDelta(
  groupId: string,
  email: string,
  productId: string,
  delta: number,
) {
  return request<{ group: BackendGroup; summary: BackendSummary }>(
    `/groups/${groupId}/cart`,
    {
      method: "POST",
      body: JSON.stringify({ email, productId, delta }),
    },
  );
}

export async function backendCheckout(groupId: string, email: string) {
  return request<{ group: BackendGroup; summary: BackendSummary }>(
    `/groups/${groupId}/checkout`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function backendStripePaymentSheetParams(
  groupId: string,
  email: string,
) {
  return request<{
    paymentIntentClientSecret: string;
    customerId: string;
    ephemeralKeySecret: string;
    publishableKey: string;
  }>("/stripe/payment-sheet", {
    method: "POST",
    body: JSON.stringify({ groupId, email }),
  });
}

export async function backendRegisterPushToken(email: string, token: string) {
  return request<{ ok: true }>("/push/register", {
    method: "POST",
    body: JSON.stringify({ email, token }),
  });
}
