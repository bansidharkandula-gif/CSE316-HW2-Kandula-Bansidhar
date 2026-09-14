/**
 * vitest.config.js
 *
 * Vitest is our unit test runner, chosen over Jest for the same reason as in
 * HW1: every file in this project is a native ES module. It now has a second
 * reason too, and a better one — Vitest uses Vite, so the JSX in a component is
 * compiled by exactly the same pipeline that compiles it for the browser. There
 * is no second build configuration to keep in step with the first, and no way
 * for a test to pass against a differently transformed version of the file the
 * user actually gets.
 *
 * TWO AXES, KEPT SEPARATE
 * -----------------------
 * There are two independent questions to ask about any test, and they are easy
 * to confuse because both sound like "what kind of test is this".
 *
 *   SCOPE        how much of the application is involved? One module, several
 *                working together, or the whole thing end to end?
 *   ENVIRONMENT  what machinery does it need in order to run? Nothing at all,
 *                a fake DOM, or a real browser?
 *
 * The folders answer the first question:
 *
 *   tests/unit          one module, on its own
 *   tests/integration   several of our modules wired together, components
 *                       included, driven the way a user drives them
 *   tests/e2e           the whole application in a real browser (Playwright)
 *
 * The docblock at the top of each file answers the second. A file that needs a
 * document, wherever it lives, opens with the line
 *
 *     // @vitest-environment jsdom
 *
 * The two do not line up, which is exactly why they are recorded separately.
 * DataStorageManager is a unit test that needs a document, because local storage
 * belongs to the window. wolfieList is a unit test that needs nothing at all,
 * and the fact that it can pass with no document in existence is itself evidence
 * that the model really is independent of the user interface. That evidence
 * matters more in HW2 than it did in HW1, because it is the thing that proves
 * the model did not quietly acquire a dependency on React.
 *
 * WHAT IS NO LONGER HERE
 * ----------------------
 * HW1's suite needed tests/helpers/app.js: 250 lines that reset the module
 * registry between tests, rebuilt the whole module graph, mounted index.html and
 * booted the application the way main.js did. It existed because the application
 * was a graph of long lived objects with static state — a Singleton and a static
 * modal stack — that leaked from one test into the next.
 *
 * All of it is gone, replaced by render() from @testing-library/react. A
 * component tree is built fresh per test and thrown away after it, so there is
 * nothing to leak and nothing to reset. The one piece of genuinely global state
 * left is the storage Singleton, and it has a resetInstanceForTesting() of its
 * own.
 *
 * WHERE THIS FILE LIVES
 * ---------------------
 * In tests/, beside the tests it runs, rather than in the project root where
 * Vitest would find it by convention. The npm scripts point at it with --config,
 * so run the tests with `npm test` rather than a bare `npx vitest`: without the
 * --config a bare run finds no configuration at all, and Vitest's own default
 * pattern would sweep up Playwright's *.spec.js files and fail on them.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// the project root is one level up from this file. Anchoring to it means every
// path below is written from the root, as it reads, whatever directory the
// runner was started in
const ROOT = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
    root: ROOT,

    // the same plugin vite.config.js uses, so a component is compiled for a test
    // exactly as it is compiled for the browser
    plugins: [react()],

    test: {
        // plain Node is the default, and files that need a document opt in with
        // the @vitest-environment docblock described above
        environment: 'node',

        // toBeInTheDocument, toHaveValue and the rest of the DOM matchers, plus
        // the automatic cleanup that unmounts every rendered tree after its test
        setupFiles: ['./tests/setup.js'],

        // all three tiers live under tests/, but this runner only owns two of
        // them. Note that Vitest looks for *.test.js(x) while Playwright's specs
        // are named *.spec.js, so the two never collide even by accident.
        include: [
            'tests/unit/**/*.test.{js,jsx}',
            'tests/integration/**/*.test.{js,jsx}'
        ],

        // Playwright owns tests/e2e. Without this Vitest would try to run those
        // files too and fail on an import it knows nothing about.
        exclude: ['node_modules/**', 'tests/e2e/**', 'tests/output/**'],

        // DateUtil exists to avoid a time zone bug that only appears in the
        // evening in a zone behind UTC. Pinning the zone means that test proves
        // the same thing on a grader's machine in any part of the world.
        env: {
            TZ: 'America/New_York'
        },

        // undo every vi.spyOn and vi.stubGlobal between tests, so no test can
        // ever be affected by one that ran before it
        restoreMocks: true,
        unstubGlobals: true,

        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            reportsDirectory: 'tests/output/coverage',
            include: ['src/**/*.{js,jsx}'],
            // main.jsx is nothing but wiring and it starts the application the
            // moment it is imported, so it is covered by the Playwright tests
            // rather than here
            exclude: ['src/main.jsx']
        }
    }
});
