import { getBackendBaseUrl } from "./backend";

describe("getBackendBaseUrl", () => {
  const prev = process.env.EXPO_PUBLIC_BACKEND_URL;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
  });

  afterAll(() => {
    if (typeof prev === "string") process.env.EXPO_PUBLIC_BACKEND_URL = prev;
    else delete process.env.EXPO_PUBLIC_BACKEND_URL;
  });

  it("throws if EXPO_PUBLIC_BACKEND_URL is missing", () => {
    expect(() => getBackendBaseUrl()).toThrow(/EXPO_PUBLIC_BACKEND_URL/);
  });

  it("returns EXPO_PUBLIC_BACKEND_URL when set", () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = "http://localhost:3001";
    expect(getBackendBaseUrl()).toBe("http://localhost:3001");
  });
});
