import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  checkoutCart,
  createOrderGroup,
  getMenu,
  getOrderGroup,
  inviteUser,
  joinGroup,
  OrderGroup,
  Product,
  registerPushToken,
  removeInvite as removeInviteApi,
  updateCart,
} from "@/api/backend";

import { registerForPushNotificationsAsync } from "@/lib/push-notifications";

export type { Product } from "@/api/backend";

export type GroupOrderState = {
  groupId: string;
  hostEmail: string;
  invitedEmails: string[];
  joinedEmails: string[];
  activeUserEmail: string;
  cartsByEmail: Record<string, Record<string, number>>;
};

type ServerResult<T> = { ok: true; value: T } | { ok: false; reason: string };

type PendingState = {
  startGroup: boolean;
  loadGroup: boolean;
  addInvite: boolean;
  removeInvite: boolean;
  checkout: boolean;
};

export type GroupOrderContextValue = {
  state: GroupOrderState;
  products: Product[];
  pending: PendingState;
  actions: {
    startGroup: (
      hostEmail: string,
    ) => Promise<ServerResult<{ groupId: string }>>;
    loadGroup: (groupId: string, email: string) => Promise<ServerResult<void>>;
    refreshGroup: () => Promise<void>;
    resetGroup: () => void;
    addInvite: (email: string) => Promise<ServerResult<void>>;
    removeInvite: (email: string) => Promise<ServerResult<void>>;
    setActiveUserEmail: (email: string) => void;
    addToCart: (productId: string) => void;
    decrementFromCart: (productId: string) => void;
    removeFromCart: (productId: string) => void;
    clearCartForEmail: (email: string) => void;
    checkout: () => Promise<ServerResult<void>>;
  };
  selectors: {
    participants: string[];
    isHostActive: boolean;
    cartForActiveUser: Record<string, number>;
    getSubtotalCentsForEmail: (email: string) => number;
    getTotalCents: () => number;
  };
};

const GroupOrderContext = createContext<GroupOrderContextValue | null>(null);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function GroupOrderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GroupOrderState>({
    groupId: "",
    hostEmail: "",
    invitedEmails: [],
    joinedEmails: [],
    activeUserEmail: "",
    cartsByEmail: {},
  });

  const [products, setProducts] = useState<Product[]>([]);

  const [pending, setPending] = useState<PendingState>({
    startGroup: false,
    loadGroup: false,
    addInvite: false,
    removeInvite: false,
    checkout: false,
  });

  const applyGroup = useCallback((group: OrderGroup) => {
    setState((prev) => {
      const invitedEmails = group.invitedEmails.slice(0, 2);
      const participants = [group.hostEmail, ...invitedEmails];
      const nextActive =
        prev.activeUserEmail && participants.includes(prev.activeUserEmail)
          ? prev.activeUserEmail
          : group.hostEmail;
      return {
        groupId: group.id,
        hostEmail: group.hostEmail,
        invitedEmails,
        joinedEmails: Array.isArray(group.joinedEmails)
          ? group.joinedEmails
          : [group.hostEmail],
        activeUserEmail: nextActive,
        cartsByEmail: group.cartsByEmail,
      };
    });
  }, []);

  useEffect(() => {
    if (!state.groupId) return;
    const interval = setInterval(() => {
      getOrderGroup(state.groupId)
        .then((res) => applyGroup(res.group))
        .catch(() => {
          // ignore
        });
    }, 3000);
    return () => clearInterval(interval);
  }, [applyGroup, state.groupId]);

  useEffect(() => {
    let cancelled = false;
    getMenu()
      .then((res) => {
        if (cancelled) return;
        const mapped: Product[] = res.products;
        setProducts(mapped);
      })
      .catch(() => {
        // ignore; fall back to local menu
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startGroup = useCallback(
    async (
      hostEmailRaw: string,
    ): Promise<ServerResult<{ groupId: string }>> => {
      if (pending.startGroup) {
        return { ok: false, reason: "Creating group already in progress." };
      }

      const hostEmail = normalizeEmail(hostEmailRaw);
      setPending((p) => ({ ...p, startGroup: true }));
      try {
        const res = await createOrderGroup(hostEmail);
        applyGroup(res.group);
        return { ok: true, value: { groupId: res.group.id } };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : "Failed to create group.",
        };
      } finally {
        setPending((p) => ({ ...p, startGroup: false }));
      }
    },
    [applyGroup, pending.startGroup],
  );

  const refreshGroup = useCallback(async () => {
    if (!state.groupId) return;
    const res = await getOrderGroup(state.groupId);
    applyGroup(res.group);
  }, [applyGroup, state.groupId]);

  const loadGroup = useCallback(
    async (
      groupIdRaw: string,
      emailRaw: string,
    ): Promise<ServerResult<void>> => {
      if (pending.loadGroup) {
        return { ok: false, reason: "Join already in progress." };
      }

      const groupId = String(groupIdRaw || "").trim();
      const email = normalizeEmail(emailRaw);
      if (!groupId) return { ok: false, reason: "Enter a group ID." };
      if (!email) return { ok: false, reason: "Enter an email address." };
      if (!/^\S+@\S+\.\S+$/.test(email))
        return { ok: false, reason: "Enter a valid email address." };

      setPending((p) => ({ ...p, loadGroup: true }));
      try {
        const res = await getOrderGroup(groupId);
        const participants = [res.group.hostEmail, ...res.group.invitedEmails];
        if (!participants.includes(email)) {
          return {
            ok: false,
            reason: "That email is not invited to this group.",
          };
        }

        applyGroup(res.group);
        await joinGroup(groupId, email);
        setState((prev) => ({ ...prev, activeUserEmail: email }));
        return { ok: true, value: undefined };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : "Failed to load group.",
        };
      } finally {
        setPending((p) => ({ ...p, loadGroup: false }));
      }
    },
    [applyGroup, pending.loadGroup],
  );

  const resetGroup = useCallback(() => {
    setState({
      groupId: "",
      hostEmail: "",
      invitedEmails: [],
      joinedEmails: [],
      activeUserEmail: "",
      cartsByEmail: {},
    });
  }, []);

  const addInvite = useCallback(
    async (emailRaw: string): Promise<ServerResult<void>> => {
      if (pending.addInvite) {
        return { ok: false, reason: "Invite already in progress." };
      }

      const email = normalizeEmail(emailRaw);
      if (!state.groupId) return { ok: false, reason: "Start a group first." };
      if (!email) return { ok: false, reason: "Enter an email address." };
      if (!/^\S+@\S+\.\S+$/.test(email))
        return { ok: false, reason: "Enter a valid email address." };
      if (email === state.hostEmail)
        return { ok: false, reason: "Host is already in the group." };
      if (state.invitedEmails.includes(email))
        return { ok: false, reason: "That email is already invited." };
      if (state.invitedEmails.length >= 2)
        return {
          ok: false,
          reason: "Group is capped at 3 total participants.",
        };

      setPending((p) => ({ ...p, addInvite: true }));
      try {
        const res = await inviteUser(state.groupId, email);
        applyGroup(res.group);
        return { ok: true, value: undefined };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : "Invite failed.",
        };
      } finally {
        setPending((p) => ({ ...p, addInvite: false }));
      }
    },
    [
      applyGroup,
      pending.addInvite,
      state.groupId,
      state.hostEmail,
      state.invitedEmails,
    ],
  );

  const removeInvite = useCallback(
    async (emailRaw: string): Promise<ServerResult<void>> => {
      if (pending.removeInvite) {
        return { ok: false, reason: "Remove invite already in progress." };
      }

      const email = normalizeEmail(emailRaw);
      if (!state.groupId) return { ok: false, reason: "No active group." };

      setPending((p) => ({ ...p, removeInvite: true }));
      try {
        const res = await removeInviteApi(state.groupId, email);
        applyGroup(res.group);
        return { ok: true, value: undefined };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : "Remove invite failed.",
        };
      } finally {
        setPending((p) => ({ ...p, removeInvite: false }));
      }
    },
    [applyGroup, pending.removeInvite, state.groupId],
  );

  const setActiveUserEmail = useCallback((emailRaw: string) => {
    const email = normalizeEmail(emailRaw);
    setState((prev) => {
      if (!email) return prev;
      if (email !== prev.hostEmail && !prev.invitedEmails.includes(email))
        return prev;
      return {
        ...prev,
        activeUserEmail: email,
        cartsByEmail: {
          ...prev.cartsByEmail,
          [email]: prev.cartsByEmail[email] ?? {},
        },
      };
    });

    registerForPushNotificationsAsync()
      .then((res) => {
        if (!res.ok) return;
        return registerPushToken(email, res.token);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const mutateCartQuantity = useCallback(
    async (email: string, productId: string, delta: number) => {
      if (!state.groupId) return;
      const res = await updateCart(state.groupId, email, productId, delta);
      applyGroup(res.group);
    },
    [applyGroup, state.groupId],
  );

  const addToCart = useCallback(
    (productId: string) => {
      if (!state.activeUserEmail) return;
      mutateCartQuantity(state.activeUserEmail, productId, 1);
    },
    [mutateCartQuantity, state.activeUserEmail],
  );

  const decrementFromCart = useCallback(
    (productId: string) => {
      if (!state.activeUserEmail) return;
      mutateCartQuantity(state.activeUserEmail, productId, -1);
    },
    [mutateCartQuantity, state.activeUserEmail],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      if (!state.activeUserEmail) return;
      const qty = state.cartsByEmail[state.activeUserEmail]?.[productId] ?? 0;
      if (qty <= 0) return;
      mutateCartQuantity(state.activeUserEmail, productId, -qty);
    },
    [mutateCartQuantity, state.activeUserEmail, state.cartsByEmail],
  );

  const clearCartForEmail = useCallback(
    (emailRaw: string) => {
      const email = normalizeEmail(emailRaw);
      const cart = state.cartsByEmail[email] ?? {};
      const productIds = Object.keys(cart);
      productIds.forEach((productId) => {
        const qty = cart[productId] ?? 0;
        if (qty > 0) mutateCartQuantity(email, productId, -qty);
      });
    },
    [mutateCartQuantity, state.cartsByEmail],
  );

  const checkout = useCallback(async (): Promise<ServerResult<void>> => {
    if (pending.checkout) {
      return { ok: false, reason: "Checkout already in progress." };
    }
    if (!state.groupId) return { ok: false, reason: "No active group." };

    setPending((p) => ({ ...p, checkout: true }));
    try {
      const res = await checkoutCart(state.groupId, state.activeUserEmail);
      applyGroup(res.group);
      return { ok: true, value: undefined };
    } catch (e) {
      return {
        ok: false,
        reason: e instanceof Error ? e.message : "Checkout failed.",
      };
    } finally {
      setPending((p) => ({ ...p, checkout: false }));
    }
  }, [applyGroup, pending.checkout, state.activeUserEmail, state.groupId]);

  const participants = useMemo(() => {
    if (!state.hostEmail) return [];
    return [state.hostEmail, ...state.invitedEmails];
  }, [state.hostEmail, state.invitedEmails]);

  const isHostActive = useMemo(() => {
    return !!state.hostEmail && state.activeUserEmail === state.hostEmail;
  }, [state.activeUserEmail, state.hostEmail]);

  const cartForActiveUser = useMemo(() => {
    if (!state.activeUserEmail) return {};
    return state.cartsByEmail[state.activeUserEmail] ?? {};
  }, [state.activeUserEmail, state.cartsByEmail]);

  const getSubtotalCentsForEmail = useCallback(
    (emailRaw: string) => {
      const email = normalizeEmail(emailRaw);
      const cart = state.cartsByEmail[email] ?? {};
      return Object.entries(cart).reduce((sum, [productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return sum;
        return sum + product.priceCents * qty;
      }, 0);
    },
    [products, state.cartsByEmail],
  );

  const getTotalCents = useCallback(() => {
    return participants.reduce(
      (sum, email) => sum + getSubtotalCentsForEmail(email),
      0,
    );
  }, [getSubtotalCentsForEmail, participants]);

  const value = useMemo<GroupOrderContextValue>(
    () => ({
      state,
      products,
      pending,
      actions: {
        startGroup,
        loadGroup,
        refreshGroup,
        resetGroup,
        addInvite,
        removeInvite,
        setActiveUserEmail,
        addToCart,
        decrementFromCart,
        removeFromCart,
        clearCartForEmail,
        checkout,
      },
      selectors: {
        participants,
        isHostActive,
        cartForActiveUser,
        getSubtotalCentsForEmail,
        getTotalCents,
      },
    }),
    [
      addInvite,
      addToCart,
      cartForActiveUser,
      clearCartForEmail,
      decrementFromCart,
      getSubtotalCentsForEmail,
      getTotalCents,
      isHostActive,
      participants,
      pending,
      products,
      removeFromCart,
      removeInvite,
      resetGroup,
      setActiveUserEmail,
      startGroup,
      loadGroup,
      refreshGroup,
      state,
      checkout,
    ],
  );

  return (
    <GroupOrderContext.Provider value={value}>
      {children}
    </GroupOrderContext.Provider>
  );
}

export function useGroupOrder() {
  const ctx = useContext(GroupOrderContext);
  if (!ctx)
    throw new Error("useGroupOrder must be used within GroupOrderProvider");
  return ctx;
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
