import { getBaseUrl } from "./backend";

describe("getBaseUrl", () => {
  const prev = process.env.EXPO_PUBLIC_BACKEND_URL;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
  });

  afterAll(() => {
    if (typeof prev === "string") process.env.EXPO_PUBLIC_BACKEND_URL = prev;
    else delete process.env.EXPO_PUBLIC_BACKEND_URL;
  });

  it("throws if EXPO_PUBLIC_BACKEND_URL is missing", () => {
    expect(() => getBaseUrl()).toThrow(/EXPO_PUBLIC_BACKEND_URL/);
  });

  it("returns EXPO_PUBLIC_BACKEND_URL when set", () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = "http://localhost:3001";
    expect(getBaseUrl()).toBe("http://localhost:3001");
  });
});
