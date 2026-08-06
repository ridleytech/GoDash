module.exports = {
  preset: "jest-expo",
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js)",
    "<rootDir>/src/**/*.(test|spec).(ts|tsx|js)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
