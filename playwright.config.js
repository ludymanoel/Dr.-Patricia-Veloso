// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const PORT = 8123;
const BASE_URL = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 30 * 1000,
  },
});
