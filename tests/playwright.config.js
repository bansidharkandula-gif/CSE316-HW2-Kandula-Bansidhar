/**
 * playwright.config.js
 *
 * Playwright drives a real Chrome, on the real application, served by Vite.
 * These are the only tests in the project that a browser is genuinely needed
 * for, so they cover the paths that only exist once every piece is wired
 * together: does a change really survive a page reload, does Chrome's own drag
 * and drop really reorder a card, does Ctrl+Z really reach our handler.
 *
 * NO BROWSER DOWNLOAD
 * -------------------
 * channel: 'chrome' tells Playwright to drive the Google Chrome already
 * installed on this machine rather than downloading a private copy of Chromium.
 * If you would rather have the bundled browser, delete the channel line and run:
 *
 *     npx playwright install chromium
 *
 * THE SERVER
 * ----------
 * The webServer block starts Vite before the tests run and stops it afterwards,
 * on port 9100 rather than the usual 9000, so that these tests never collide with
 * the server you have running while you work.
 *
 * WHERE THIS FILE LIVES
 * ---------------------
 * In tests/, beside the specs it runs. The npm scripts point at it with --config,
 * so run the browser tests with `npm run test:e2e` rather than a bare
 * `npx playwright test`, which would find no configuration and no specs.
 */
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = Number(process.env.E2E_PORT) || 9100;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const OUTPUT = path.join(HERE, 'output');

export default defineConfig({
    testDir: './e2e',

    // everything Playwright generates goes under tests/output, which is gitignored
    outputDir: path.join(OUTPUT, 'test-results'),

    // every test gets its own browser context, so local storage always starts
    // empty and no test can see what another test saved
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: path.join(OUTPUT, 'playwright-report') }]
    ],

    use: {
        baseURL: `http://localhost:${PORT}`,
        // a click on something that is not there fails after five seconds rather
        // than waiting out the whole test, which keeps a run on unfinished work short
        actionTimeout: 5_000,
        // a trace is a complete recording of a failed run. Open one with
        //     npx playwright show-trace tests/output/test-results/.../trace.zip
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },

    projects: [
        {
            name: 'chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' }
        }
    ],

    webServer: {
        command: `npx vite --port ${PORT} --strictPort`,
        cwd: ROOT,
        url: `http://localhost:${PORT}/`,
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'pipe',
        timeout: 60_000
    }
});
