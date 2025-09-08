const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./", // Path to your Next.js app
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // 👈 keep it here
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1", // 👈 matches your tsconfig.json paths
  },
};

module.exports = createJestConfig(customJestConfig);
