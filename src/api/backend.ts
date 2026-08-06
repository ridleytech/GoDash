export type Product = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
};

export type OrderGroup = {
  id: string;
  hostEmail: string;
  invitedEmails: string[];
  joinedEmails?: string[];
  cartsByEmail: Record<string, Record<string, number>>;
  createdAt: number;
  checkedOutAt: number | null;
};

export type OrderSummary = {
  participants: string[];
  breakdown: {
    email: string;
    cart: Record<string, number>;
    subtotalCents: number;
  }[];
  totalCents: number;
};

export function getBaseUrl() {
  const value = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!value) {
    throw new Error(
      "Missing EXPO_PUBLIC_BACKEND_URL. Create a .env file and set EXPO_PUBLIC_BACKEND_URL, e.g. http://localhost:3001",
    );
  }
  return value;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
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

export async function getHealth() {
  return request<{ ok: boolean }>("/health");
}

export async function getMenu() {
  return request<{ products: Product[] }>("/menu");
}

export async function createOrderGroup(hostEmail: string) {
  return request<{ group: OrderGroup }>("/groups", {
    method: "POST",
    body: JSON.stringify({ hostEmail }),
  });
}

export async function getOrderGroup(groupId: string) {
  return request<{ group: OrderGroup; summary: OrderSummary }>(
    `/groups/${groupId}`,
  );
}

export async function inviteUser(groupId: string, email: string) {
  return request<{ group: OrderGroup; summary: OrderSummary }>(
    `/groups/${groupId}/invite`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function removeInvite(groupId: string, email: string) {
  return request<{ group: OrderGroup; summary: OrderSummary }>(
    `/groups/${groupId}/invite`,
    {
      method: "DELETE",
      body: JSON.stringify({ email }),
    },
  );
}

export async function joinGroup(groupId: string, email: string) {
  return request<{ group: OrderGroup; summary: OrderSummary }>(
    `/groups/${groupId}/join`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function updateCart(
  groupId: string,
  email: string,
  productId: string,
  delta: number,
) {
  return request<{ group: OrderGroup; summary: OrderSummary }>(
    `/groups/${groupId}/cart`,
    {
      method: "POST",
      body: JSON.stringify({ email, productId, delta }),
    },
  );
}

export async function checkoutCart(groupId: string, email: string) {
  return request<{ group: OrderGroup; summary: OrderSummary }>(
    `/groups/${groupId}/checkout`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function sendStripePaymentSheetParams(
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

export async function registerPushToken(email: string, token: string) {
  return request<{ ok: true }>("/push/register", {
    method: "POST",
    body: JSON.stringify({ email, token }),
  });
}
