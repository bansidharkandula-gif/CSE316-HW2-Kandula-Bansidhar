/**
 * IconButton.jsx
 *
 * The small duplicate and delete buttons that sit on the right of every card,
 * on both screens.
 *
 * WHY onClick STOPS PROPAGATION
 * -----------------------------
 * These buttons live inside a card that is itself clickable. Without
 * stopPropagation, pressing delete would also open the thing you were deleting.
 *
 * HW1 had the same problem and solved it differently: it had one click handler
 * on the whole container and worked out what had been pressed by asking
 * event.target.closest('[data-action]'). That was event delegation, and it was
 * the right answer there, because cards were thrown away and rebuilt constantly
 * and a handler attached to a card that gets thrown away is a handler leaked.
 *
 * React attaches one real listener at the root and dispatches from there, so
 * handlers on components cost nothing to add or remove, and the delegation is
 * no longer worth its own machinery. The data-action attributes are kept anyway
 * — they cost nothing and the end to end tests select on them.
 */
export default function IconButton({ action, label, glyph, danger = false, onClick }) {
    const dangerHover = danger
        ? 'hover:bg-sbu-red hover:text-sbu-white'
        : 'hover:bg-grey-200 hover:text-sbu-black';

    return (
        <button
            type="button"
            data-action={action}
            title={label}
            aria-label={label}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={`h-9 w-9 cursor-pointer rounded-control border-none bg-transparent
                        font-symbol text-[1.125rem] leading-none text-grey-700
                        transition-[background-color,color] duration-150
                        focus-visible:outline-[0.1875rem] focus-visible:outline-offset-[0.0625rem]
                        focus-visible:outline-sbu-red ${dangerHover}`}>
            {glyph}
        </button>
    );
}

/** the two glyphs, with U+FE0E after each so the browser draws them as text in
 *  our own colors rather than reaching for the emoji font */
export const DUPLICATE_GLYPH = '⧉︎';
export const DELETE_GLYPH = '\u{1F5D1}︎';
