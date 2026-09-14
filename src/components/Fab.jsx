/**
 * Fab.jsx
 *
 * The floating + button that sits at the bottom right of both screens.
 *
 * Two screens needed an identical button in HW1 and got it by sharing a .fab
 * class in the stylesheet. Sharing a component instead is strictly better: the
 * class only guaranteed that both buttons looked alike, while this guarantees
 * that both buttons ARE alike, down to the accessible name being required
 * rather than merely conventional.
 */
export default function Fab({ id, label, onClick }) {
    return (
        <button
            id={id}
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className="absolute right-8 bottom-6 h-14 w-14 cursor-pointer rounded-full
                       border-[0.1875rem] border-sbu-white bg-sbu-red text-[2.25rem]
                       leading-none font-light text-sbu-white shadow-card-hover
                       transition-[background-color,transform] duration-150
                       hover:scale-[1.06] hover:bg-sbu-red-light
                       active:scale-[0.98] active:bg-sbu-red-dark
                       focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2
                       focus-visible:outline-sbu-black">
            +
        </button>
    );
}
