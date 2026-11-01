/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/layer/**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 60,
    },
  },
  testTimeout: 30000,
  verbose: true,
};
