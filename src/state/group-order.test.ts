import { formatMoney } from "./group-order";

jest.mock("@react-native-firebase/messaging", () => {
  const mockMessaging = () => ({
    requestPermission: jest.fn(async () => 1),
    getToken: jest.fn(async () => "test-fcm-token"),
    AuthorizationStatus: {
      AUTHORIZED: 1,
      PROVISIONAL: 2,
    },
  });
  mockMessaging.AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };
  return {
    __esModule: true,
    default: mockMessaging,
  };
});

jest.mock("expo-device", () => ({
  __esModule: true,
  isDevice: true,
}));

describe("formatMoney", () => {
  it("formats cents as USD", () => {
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(659)).toBe("$6.59");
    expect(formatMoney(123456)).toBe("$1,234.56");
  });
});
