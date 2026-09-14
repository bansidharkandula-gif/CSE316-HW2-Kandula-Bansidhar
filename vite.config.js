/**
 * vite.config.js
 *
 * HW1 shipped its own tiny Node Web server and the browser imported the ES
 * modules directly. HW2 has a build step, because JSX is not something a browser
 * can run: every .jsx file has to be turned into ordinary JavaScript first. Vite
 * is what does that, and while developing it does it one file at a time, the
 * instant the file is saved.
 *
 * Two plugins, and nothing else:
 *
 *   @vitejs/plugin-react   compiles JSX and enables Fast Refresh, so a component
 *                          can be edited without the page reloading and without
 *                          the application losing the list it currently has open
 *   @tailwindcss/vite      Tailwind v4. Note that there is no tailwind.config.js
 *                          anywhere in this project: v4 is configured from CSS,
 *                          in the @theme block at the top of
 *                          src/css/wolfie_lists.css
 *
 * The port is pinned to 9000 to match HW1, and strictPort means that if 9000 is
 * already taken Vite says so and stops rather than quietly moving to 9001 and
 * leaving the end to end tests pointing at nothing.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 9000,
        strictPort: true
    },
    preview: {
        port: 9000,
        strictPort: true
    }
});
