import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  backendCartDelta,
  backendCheckout,
  backendCreateGroup,
  backendGetGroup,
  BackendGroup,
  backendInvite,
  backendJoinGroup,
  backendMenu,
  BackendProduct,
  backendRegisterPushToken,
  backendRemoveInvite,
} from "@/api/backend";

import { registerForPushNotificationsAsync } from "@/lib/push-notifications";

export type Product = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
};

export type GroupOrderState = {
  groupId: string;
  hostEmail: string;
  invitedEmails: string[];
  joinedEmails: string[];
  activeUserEmail: string;
  cartsByEmail: Record<string, Record<string, number>>;
};

export type GroupOrderContextValue = {
  state: GroupOrderState;
  products: Product[];
  actions: {
    startGroup: (
      hostEmail: string,
    ) => Promise<{ ok: true } | { ok: false; reason: string }>;
    loadGroup: (
      groupId: string,
      email: string,
    ) => Promise<{ ok: true } | { ok: false; reason: string }>;
    refreshGroup: () => Promise<void>;
    resetGroup: () => void;
    addInvite: (
      email: string,
    ) => Promise<{ ok: true } | { ok: false; reason: string }>;
    removeInvite: (email: string) => Promise<void>;
    setActiveUserEmail: (email: string) => void;
    addToCart: (productId: string) => void;
    decrementFromCart: (productId: string) => void;
    removeFromCart: (productId: string) => void;
    clearCartForEmail: (email: string) => void;
    checkout: () => Promise<void>;
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

const MENU_PRODUCTS: Product[] = [
  {
    id: "impossible-burger",
    name: "Impossible Burger",
    priceCents: 899,
    imageUrl:
      "https://images.ctfassets.net/hhv516v5f7sj/5wJjddNA6Rv3Bq23HjSkv5/309bd1b40afe63fb925afa38c0f2b104/southwest-burger-patties-cutout-image-1500x500.png",
  },
  {
    id: "cajun-fries",
    name: "Cajun Fries",
    priceCents: 349,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbx3G_da4Ll0SSzG8Ut6ZK0FUGuF7GTFiXfSt5MHRWuGYdKmgjEopBX9Hi&s=10",
  },
  {
    id: "peach-lemonade",
    name: "Peach Lemonade",
    priceCents: 499,
    imageUrl:
      "https://www.themediterraneandish.com/wp-content/uploads/2024/06/peach-lemonade-edited-13.jpg",
  },
];

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

  const [products, setProducts] = useState<Product[]>(MENU_PRODUCTS);

  const applyBackendGroup = useCallback((group: BackendGroup) => {
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
      backendGetGroup(state.groupId)
        .then((res) => applyBackendGroup(res.group))
        .catch(() => {
          // ignore
        });
    }, 3000);
    return () => clearInterval(interval);
  }, [applyBackendGroup, state.groupId]);

  useEffect(() => {
    let cancelled = false;
    backendMenu()
      .then((res) => {
        if (cancelled) return;
        const mapped: BackendProduct[] = res.products;
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
    ): Promise<{ ok: true } | { ok: false; reason: string }> => {
      const hostEmail = normalizeEmail(hostEmailRaw);
      try {
        const res = await backendCreateGroup(hostEmail);
        applyBackendGroup(res.group);
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : "Failed to create group.",
        };
      }
    },
    [applyBackendGroup],
  );

  const refreshGroup = useCallback(async () => {
    if (!state.groupId) return;
    const res = await backendGetGroup(state.groupId);
    applyBackendGroup(res.group);
  }, [applyBackendGroup, state.groupId]);

  const loadGroup = useCallback(
    async (
      groupIdRaw: string,
      emailRaw: string,
    ): Promise<{ ok: true } | { ok: false; reason: string }> => {
      const groupId = String(groupIdRaw || "").trim();
      const email = normalizeEmail(emailRaw);
      if (!groupId) return { ok: false, reason: "Enter a group ID." };
      if (!email) return { ok: false, reason: "Enter an email address." };
      if (!/^\S+@\S+\.\S+$/.test(email))
        return { ok: false, reason: "Enter a valid email address." };

      try {
        const res = await backendGetGroup(groupId);
        const participants = [res.group.hostEmail, ...res.group.invitedEmails];
        if (!participants.includes(email)) {
          return {
            ok: false,
            reason: "That email is not invited to this group.",
          };
        }

        applyBackendGroup(res.group);
        await backendJoinGroup(groupId, email);
        setActiveUserEmail(email);
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : "Failed to load group.",
        };
      }
    },
    [applyBackendGroup, setActiveUserEmail],
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
    async (
      emailRaw: string,
    ): Promise<{ ok: true } | { ok: false; reason: string }> => {
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

      try {
        const res = await backendInvite(state.groupId, email);
        applyBackendGroup(res.group);
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : "Invite failed.",
        };
      }
    },
    [applyBackendGroup, state.groupId, state.hostEmail, state.invitedEmails],
  );

  const removeInvite = useCallback(
    async (emailRaw: string) => {
      const email = normalizeEmail(emailRaw);
      if (!state.groupId) return;
      const res = await backendRemoveInvite(state.groupId, email);
      applyBackendGroup(res.group);
    },
    [applyBackendGroup, state.groupId],
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
        return backendRegisterPushToken(email, res.token);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const mutateCartQuantity = useCallback(
    async (email: string, productId: string, delta: number) => {
      if (!state.groupId) return;
      const res = await backendCartDelta(
        state.groupId,
        email,
        productId,
        delta,
      );
      applyBackendGroup(res.group);
    },
    [applyBackendGroup, state.groupId],
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

  const checkout = useCallback(async () => {
    if (!state.groupId) return;
    const res = await backendCheckout(state.groupId, state.activeUserEmail);
    applyBackendGroup(res.group);
  }, [applyBackendGroup, state.activeUserEmail, state.groupId]);

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
