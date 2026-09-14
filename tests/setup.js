/**
 * setup.js
 *
 * Run once before every test file, by the setupFiles line in vitest.config.js.
 *
 * It does two things, and it is worth knowing what each one buys, because
 * between them they replace the whole of HW1's tests/helpers/app.js.
 *
 * 1. THE DOM MATCHERS. @testing-library/jest-dom adds expect(...).toBeVisible(),
 *    .toHaveValue(), .toBeDisabled() and friends. Without it you end up writing
 *    expect(element.disabled).toBe(true), which passes just as well but says
 *    nothing useful when it fails.
 *
 * 2. CLEANUP BETWEEN TESTS. Every tree rendered by @testing-library/react is
 *    unmounted after the test that rendered it, and its container is removed
 *    from the document.
 *
 *    That second one is the whole of HW1's leak problem solved in one line, and
 *    it is worth understanding why rather than simply enjoying it. HW1's tests
 *    had to call vi.resetModules() before every single test, and had to import
 *    application classes THROUGH a helper rather than at the top of the file,
 *    because the application was a graph of long lived objects: a Singleton that
 *    would answer with the previous test's instance, a static modal stack that
 *    stayed open, and document level event handlers that accumulated all run
 *    until a keystroke in a late test was delivered to a dozen dead listeners.
 *
 *    None of that can happen to a component. Its state lives in the tree, its
 *    handlers are removed by the effects that added them, and unmounting takes
 *    the lot. The one genuinely global thing left is the storage Singleton, and
 *    tests that touch it call DataStorageManager.resetInstanceForTesting().
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});
