import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import type { BackendGroup, BackendSummary } from "@/api/backend";

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

const mockBackendCreateGroup = jest.fn();
const mockBackendGetGroup = jest.fn();
const mockBackendJoinGroup = jest.fn();
const mockBackendInvite = jest.fn();
const mockBackendRemoveInvite = jest.fn();
const mockBackendCartDelta = jest.fn();
const mockBackendCheckout = jest.fn();
const mockBackendMenu = jest.fn();
const mockBackendRegisterPushToken = jest.fn();

jest.mock("@/api/backend", () => ({
  __esModule: true,
  backendCreateGroup: (...args: any[]) => mockBackendCreateGroup(...args),
  backendGetGroup: (...args: any[]) => mockBackendGetGroup(...args),
  backendJoinGroup: (...args: any[]) => mockBackendJoinGroup(...args),
  backendInvite: (...args: any[]) => mockBackendInvite(...args),
  backendRemoveInvite: (...args: any[]) => mockBackendRemoveInvite(...args),
  backendCartDelta: (...args: any[]) => mockBackendCartDelta(...args),
  backendCheckout: (...args: any[]) => mockBackendCheckout(...args),
  backendMenu: (...args: any[]) => mockBackendMenu(...args),
  backendRegisterPushToken: (...args: any[]) =>
    mockBackendRegisterPushToken(...args),
}));

function makeSummary(group: BackendGroup): BackendSummary {
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
    mockBackendCreateGroup.mockReset();
    mockBackendGetGroup.mockReset();
    mockBackendJoinGroup.mockReset();
    mockBackendInvite.mockReset();
    mockBackendRemoveInvite.mockReset();
    mockBackendCartDelta.mockReset();
    mockBackendCheckout.mockReset();
    mockBackendMenu.mockReset();
    mockBackendRegisterPushToken.mockReset();

    mockBackendMenu.mockResolvedValue({ products: [] });
  });

  it("startGroup sets state from backend", async () => {
    const group: BackendGroup = {
      id: "g1",
      hostEmail: "host@email.com",
      invitedEmails: [],
      joinedEmails: ["host@email.com"],
      cartsByEmail: { "host@email.com": {} },
      createdAt: Date.now(),
      checkedOutAt: null,
    };

    mockBackendCreateGroup.mockResolvedValue({ group });

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

  it("applyBackendGroup caps invitedEmails to 2", async () => {
    const baseGroup: BackendGroup = {
      id: "g1",
      hostEmail: "host@email.com",
      invitedEmails: [],
      joinedEmails: ["host@email.com"],
      cartsByEmail: { "host@email.com": {} },
      createdAt: Date.now(),
      checkedOutAt: null,
    };

    mockBackendCreateGroup.mockResolvedValue({ group: baseGroup });

    const groupWith3Invites: BackendGroup = {
      ...baseGroup,
      invitedEmails: ["a@email.com", "b@email.com", "c@email.com"],
      cartsByEmail: {
        "host@email.com": {},
        "a@email.com": {},
        "b@email.com": {},
        "c@email.com": {},
      },
    };

    mockBackendInvite.mockResolvedValue({
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
    const baseGroup: BackendGroup = {
      id: "g1",
      hostEmail: "host@email.com",
      invitedEmails: ["a@email.com"],
      joinedEmails: ["host@email.com", "a@email.com"],
      cartsByEmail: { "host@email.com": {}, "a@email.com": {} },
      createdAt: Date.now(),
      checkedOutAt: null,
    };

    mockBackendCreateGroup.mockResolvedValue({ group: baseGroup });

    const groupWithoutInvite: BackendGroup = {
      ...baseGroup,
      invitedEmails: [],
      joinedEmails: ["host@email.com"],
      cartsByEmail: { "host@email.com": {} },
    };

    mockBackendGetGroup.mockResolvedValue({
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
