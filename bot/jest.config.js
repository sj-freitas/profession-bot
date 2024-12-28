require("dotenv").config({ path: ".env.local" });

module.exports = {
  maxWorkers: 1, // Same as --runInBand
  preset: "ts-jest",
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  testEnvironment: "node",
};
