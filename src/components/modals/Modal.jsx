/**
 * Modal.jsx
 *
 * The shell all three modals sit in: the backdrop, the box, the focus trap, and
 * what Escape means.
 *
 * A modal is not just a box that appears on top of things. Making one behave
 * properly means handling several details at once, and they are handled here,
 * once, rather than three times over:
 *
 *   - a shared backdrop that dims and blocks the screen underneath
 *   - a stack, so that a modal may legitimately open on top of another modal, as
 *     happens when the item editor complains about an empty description
 *   - Escape cancels the topmost modal, and only the topmost
 *   - focus moves into the modal when it opens and returns to wherever it came
 *     from when it closes
 *   - Tab is trapped inside the modal, since being able to tab to the buttons of
 *     the screen behind a modal defeats the entire point of one
 *
 * INHERITANCE BECAME COMPOSITION, AND THAT IS THE INTERESTING PART
 * ---------------------------------------------------------------
 * HW1 had an abstract Modal class that ItemModal, ConfirmModal and AlertModal
 * each extended, overriding focusFirstControl() and requestCancel() to say how
 * they differed. That is the ordinary object oriented answer and there was
 * nothing wrong with it.
 *
 * React has no equivalent, and deliberately so: a component cannot extend
 * another component. What replaces it is composition — the three modals do not
 * inherit from this one, they render INSIDE it and pass it what it needs to
 * know. Where HW1 overrode a method, here you pass a prop.
 *
 * The rule of thumb the change encodes is worth stating, because it long
 * predates React and applies well beyond it: prefer composition to inheritance.
 * An inherited method silently becomes part of every subclass's contract, and
 * changing the base class can break a subclass that never mentioned the method.
 * A prop cannot do that.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModals } from '../../context/ModalContext.jsx';

/** the selector for everything a user can legitimately land on with Tab */
const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), '
    + 'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
    name,
    id,
    role = 'dialog',
    labelledBy,
    describedBy,
    small = false,
    onCancel,
    initialFocusRef,
    children
}) {
    const { topModal } = useModals();
    const elementRef = useRef(null);
    const elementToRefocus = useRef(null);
    const shakeRef = useRef(null);

    const isTopMost = topModal === name;

    /**
     * Remember where focus was when this modal opened, and put it back when the
     * modal closes. The cleanup function is the whole mechanism: React runs it
     * when this component unmounts, which is exactly when the modal has gone.
     */
    useEffect(() => {
        elementToRefocus.current = document.activeElement;

        return () => {
            const target = elementToRefocus.current;
            if (target && typeof target.focus === 'function' && document.contains(target)) {
                target.focus();
            }
        };
    }, []);

    /**
     * Move focus to the control this modal wants to start on. Each modal says
     * which that is by handing us a ref; the item editor picks its description
     * field, and the warning modal deliberately picks Cancel rather than the
     * destructive button.
     */
    useEffect(() => {
        if (!isTopMost) return;
        const preferred = initialFocusRef?.current;
        if (preferred) {
            preferred.focus();
            if (typeof preferred.select === 'function') preferred.select();
            return;
        }
        elementRef.current?.querySelector(FOCUSABLE)?.focus();
    }, [isTopMost, initialFocusRef]);

    /**
     * Escape and Tab, for the topmost modal only.
     *
     * HW1 installed one document level handler for all modals, guarded by a
     * static latch so it could not be installed twice. Here the handler belongs
     * to the modal that is on top, and React removes it when that modal closes.
     * There is no latch and no leak, because adding and removing are the same
     * effect.
     */
    useEffect(() => {
        if (!isTopMost) return undefined;

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
            } else if (event.key === 'Tab') {
                trapTab(event, elementRef.current);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isTopMost, onCancel]);

    /**
     * Clicking the backdrop is deliberately NOT "close". A modal exists to insist
     * on an answer, and quietly throwing away a half finished edit because the
     * user clicked slightly outside the box is unkind. Instead the modal gives a
     * small shake to point out that it is waiting.
     */
    function handleBackdropClick() {
        const element = elementRef.current;
        if (element === null) return;

        element.classList.remove('modal-shake');
        // reading offsetWidth forces the browser to apply the removal before the
        // class goes back on, which is what lets the animation run again
        void element.offsetWidth;
        element.classList.add('modal-shake');

        clearTimeout(shakeRef.current);
        shakeRef.current = setTimeout(() => element.classList.remove('modal-shake'), 400);
    }

    useEffect(() => () => clearTimeout(shakeRef.current), []);

    /**
     * A PORTAL, and this is the one piece of React machinery in the project that
     * exists purely to solve a problem HW1 solved by hand.
     *
     * HW1 put all three modals outside #app in index.html, so that no layout rule
     * meant for a screen could reach them and so that the rule disabling clicks
     * behind a modal could not disable the modal itself.
     *
     * The item modal genuinely belongs INSIDE CurrentListProvider in the
     * component tree — it edits the open list, and cannot exist without one. But
     * it must be rendered OUTSIDE #app in the document. A portal is exactly that
     * separation: the component stays where it is in the tree, keeping every
     * context it can reach and every event that bubbles through React, while its
     * DOM lands somewhere else entirely.
     *
     * Being in the tree and being in the document stop having to be the same
     * question, which is what makes the modal both correctly placed and correctly
     * connected rather than having to choose.
     */
    return createPortal(
        <>
            {/* one backdrop per modal, stacked. Only the topmost is clickable,
                which is what keeps a click from reaching a modal underneath. */}
            <div
                id={isTopMost ? 'modal-backdrop' : undefined}
                onClick={isTopMost ? handleBackdropClick : undefined}
                className="fixed inset-0 z-900 bg-[rgba(34,31,29,0.55)]" />

            <div
                id={id}
                ref={elementRef}
                role={role}
                aria-modal="true"
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                className={`modal fixed top-1/2 left-1/2 z-1000 max-h-[calc(100vh-2rem)]
                            -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-modal
                            bg-sbu-white shadow-modal
                            ${small ? 'w-[min(27rem,calc(100vw-2rem))]' : 'w-[min(34rem,calc(100vw-2rem))]'}`}>
                {children}
            </div>
        </>,
        document.body
    );
}

/**
 * Keeps Tab and Shift+Tab inside this modal by wrapping around at both ends.
 *
 * @param {KeyboardEvent} event
 * @param {HTMLElement} element the modal's own element
 */
function trapTab(event, element) {
    if (element === null) return;

    const focusable = [...element.querySelectorAll(FOCUSABLE)]
        // offsetParent is null for anything not actually being displayed, which
        // is how a hidden control is kept out of the tab order
        .filter((candidate) => candidate.offsetParent !== null || candidate === document.activeElement);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !element.contains(active))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (active === last || !element.contains(active))) {
        event.preventDefault();
        first.focus();
    }
}

// -----------------------------------------------------------------------------
// the pieces every modal is built from, so that three modals cannot drift apart
// -----------------------------------------------------------------------------

export function ModalHeading({ id, titleId, icon, warning = false, children }) {
    return (
        <h2 id={id}
            className={`m-0 flex items-center gap-2.5 rounded-t-modal px-5 py-4
                        text-[1.1875rem] text-sbu-white
                        ${warning ? 'bg-sbu-black' : 'bg-sbu-red'}`}>
            {icon && <span className="text-[1.375rem] leading-none" aria-hidden="true">{icon}</span>}
            <span id={titleId}>{children}</span>
        </h2>
    );
}

export function ModalMessage({ id, children }) {
    return <p id={id} className="m-0 p-5 text-grey-700">{children}</p>;
}

export function ModalFooter({ children }) {
    return (
        <div className="flex items-center gap-2 rounded-b-modal border-t border-grey-200
                        bg-grey-100 px-5 py-3.5">
            {children}
        </div>
    );
}

/** the four button styles, so that a button cannot be almost right */
export const BUTTON_STYLES = {
    base: 'cursor-pointer rounded-control border border-transparent px-[1.125rem] py-2 '
        + 'text-[0.9375rem] font-semibold transition-[background-color,color,opacity] '
        + 'duration-150 focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2 '
        + 'focus-visible:outline-sbu-black disabled:cursor-default disabled:opacity-40',
    primary: 'bg-sbu-red text-sbu-white hover:not-disabled:bg-sbu-red-dark',
    secondary: 'border-grey-300 bg-sbu-white text-grey-900 hover:not-disabled:bg-grey-200',
    danger: 'bg-sbu-red text-sbu-white hover:not-disabled:bg-sbu-red-dark',
    quiet: 'bg-transparent text-grey-700 hover:not-disabled:bg-grey-200 hover:not-disabled:text-sbu-black'
};

/**
 * Note `ref` sitting in the parameter list beside every other prop. In React 18
 * that was not possible and a component that needed to expose a DOM node had to
 * be wrapped in forwardRef. React 19 passes ref to a function component like any
 * other prop, and forwardRef is on its way out. It is the smallest change in
 * this project and the one most likely to disagree with an older tutorial.
 */
export function ModalButton({ id, variant = 'secondary', disabled, onClick, title, ref, children }) {
    return (
        <button
            id={id}
            ref={ref}
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={`${BUTTON_STYLES.base} ${BUTTON_STYLES[variant]}`}>
            {children}
        </button>
    );
}
