import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import type { OrderGroup, OrderSummary } from "@/api/backend";

import {
  GroupOrderProvider,
  useGroupOrder,
  type GroupOrderContextValue,
} from "./group-order";

jest.mock("@/lib/push-notifications", () => ({
  __esModule: true,
  registerForPushNotificationsAsync: jest.fn(async () => ({
    ok: true,
    token: "test-fcm-token",
  })),
}));

const mockCreateGroup = jest.fn();
const mockGetGroup = jest.fn();
const mockJoinGroup = jest.fn();
const mockInvite = jest.fn();
const mockRemoveInvite = jest.fn();
const mockUpdateCart = jest.fn();
const mockCheckout = jest.fn();
const mockMenu = jest.fn();
const mockRegisterPushToken = jest.fn();

jest.mock("@/api/backend", () => ({
  __esModule: true,
  createOrderGroup: (...args: any[]) => mockCreateGroup(...args),
  getOrderGroup: (...args: any[]) => mockGetGroup(...args),
  joinGroup: (...args: any[]) => mockJoinGroup(...args),
  inviteUser: (...args: any[]) => mockInvite(...args),
  removeInvite: (...args: any[]) => mockRemoveInvite(...args),
  updateCart: (...args: any[]) => mockUpdateCart(...args),
  checkoutCart: (...args: any[]) => mockCheckout(...args),
  getMenu: (...args: any[]) => mockMenu(...args),
  registerPushToken: (...args: any[]) => mockRegisterPushToken(...args),
}));

function makeSummary(group: OrderGroup): OrderSummary {
  const participants = [group.hostEmail, ...group.invitedEmails];
  return { participants, breakdown: [], totalCents: 0 };
}

function Capture({
  onValue,
}: {
  onValue: (v: GroupOrderContextValue) => void;
}) {
  const value = useGroupOrder();
  onValue(value);
  return null;
}

async function renderGroupOrder() {
  let latest: GroupOrderContextValue | null = null;
  let renderer: TestRenderer.ReactTestRenderer | null = null;
  await act(async () => {
    renderer = TestRenderer.create(
      <GroupOrderProvider>
        <Capture onValue={(v) => (latest = v)} />
      </GroupOrderProvider>,
    );
  });

  if (!latest) throw new Error("Failed to capture GroupOrder context");
  if (!renderer) throw new Error("Failed to create test renderer");
  return {
    getLatest: () => latest as GroupOrderContextValue,
    unmount: async () => {
      await act(async () => {
        renderer?.unmount();
      });
    },
  };
}

describe("GroupOrderProvider + useGroupOrder", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockCreateGroup.mockReset();
    mockGetGroup.mockReset();
    mockJoinGroup.mockReset();
    mockInvite.mockReset();
    mockRemoveInvite.mockReset();
    mockUpdateCart.mockReset();
    mockCheckout.mockReset();
    mockMenu.mockReset();
    mockRegisterPushToken.mockReset();

    mockMenu.mockResolvedValue({ products: [] });
  });

  it("startGroup sets state from backend", async () => {
    const group: OrderGroup = {
      id: "g1",
      hostEmail: "host@email.com",
      invitedEmails: [],
      joinedEmails: ["host@email.com"],
      cartsByEmail: { "host@email.com": {} },
      createdAt: Date.now(),
      checkedOutAt: null,
    };

    mockCreateGroup.mockResolvedValue({ group });

    const { getLatest, unmount } = await renderGroupOrder();

    await act(async () => {
      const res = await getLatest().actions.startGroup("HOST@Email.com");
      expect(res.ok).toBe(true);
    });

    expect(getLatest().state.groupId).toBe("g1");
    expect(getLatest().state.hostEmail).toBe("host@email.com");
    expect(getLatest().state.activeUserEmail).toBe("host@email.com");

    await unmount();
  });

  it("applyGroup caps invitedEmails to 2", async () => {
    const baseGroup: OrderGroup = {
      id: "g1",
      hostEmail: "host@email.com",
      invitedEmails: [],
      joinedEmails: ["host@email.com"],
      cartsByEmail: { "host@email.com": {} },
      createdAt: Date.now(),
      checkedOutAt: null,
    };

    mockCreateGroup.mockResolvedValue({ group: baseGroup });

    const groupWith3Invites: OrderGroup = {
      ...baseGroup,
      invitedEmails: ["a@email.com", "b@email.com", "c@email.com"],
      cartsByEmail: {
        "host@email.com": {},
        "a@email.com": {},
        "b@email.com": {},
        "c@email.com": {},
      },
    };

    mockInvite.mockResolvedValue({
      group: groupWith3Invites,
      summary: makeSummary(groupWith3Invites),
    });

    const { getLatest, unmount } = await renderGroupOrder();

    await act(async () => {
      await getLatest().actions.startGroup("host@email.com");
    });

    await act(async () => {
      const res = await getLatest().actions.addInvite("a@email.com");
      expect(res.ok).toBe(true);
    });

    expect(getLatest().state.invitedEmails).toEqual([
      "a@email.com",
      "b@email.com",
    ]);

    await unmount();
  });

  it("refreshGroup normalizes activeUserEmail to host if active user is no longer a participant", async () => {
    const baseGroup: OrderGroup = {
      id: "g1",
      hostEmail: "host@email.com",
      invitedEmails: ["a@email.com"],
      joinedEmails: ["host@email.com", "a@email.com"],
      cartsByEmail: { "host@email.com": {}, "a@email.com": {} },
      createdAt: Date.now(),
      checkedOutAt: null,
    };

    mockCreateGroup.mockResolvedValue({ group: baseGroup });

    const groupWithoutInvite: OrderGroup = {
      ...baseGroup,
      invitedEmails: [],
      joinedEmails: ["host@email.com"],
      cartsByEmail: { "host@email.com": {} },
    };

    mockGetGroup.mockResolvedValue({
      group: groupWithoutInvite,
      summary: makeSummary(groupWithoutInvite),
    });

    const { getLatest, unmount } = await renderGroupOrder();

    await act(async () => {
      await getLatest().actions.startGroup("host@email.com");
    });

    await act(async () => {
      getLatest().actions.setActiveUserEmail("a@email.com");
    });

    expect(getLatest().state.activeUserEmail).toBe("a@email.com");

    await act(async () => {
      await getLatest().actions.refreshGroup();
    });

    expect(getLatest().state.activeUserEmail).toBe("host@email.com");

    await unmount();
  });
});
