/**
 * main.jsx
 *
 * The entry point. HW1's main.js built six objects, subscribed each of them to
 * the others in the right order, and started the controller. This does none of
 * that, because the wiring it was doing is now the shape of the component tree
 * in App.jsx.
 *
 * StrictMode is on deliberately. In development it renders every component
 * twice and mounts, unmounts and remounts every effect, specifically to make
 * effects that are not safe to run twice fail loudly and immediately rather
 * than in front of a grader. It does nothing at all in a production build, so
 * it costs nothing to leave on.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './css/wolfie_lists.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
