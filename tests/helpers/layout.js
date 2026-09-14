/**
 * layout.js
 *
 * jsdom parses HTML and runs scripts but never lays anything out. There are no
 * pixels in it, so getBoundingClientRect returns zeroes for everything and
 * offsetParent is always null.
 *
 * That matters for exactly one part of this application: drag and drop decides
 * whether a card lands above or below its neighbour by comparing the cursor's y
 * position against the midline of the card under it. With every rectangle
 * reporting zero height, every drop would be judged the same way.
 *
 * So the tests that need geometry fake it, and they call these helpers to do it
 * rather than stubbing getBoundingClientRect inline. The point of that is
 * honesty: a test standing on invented pixel values says so out loud, in one
 * place, instead of quietly looking like a test of real layout.
 *
 * The other half of drag and drop — that Chrome will actually begin the drag,
 * permit the drop, and deliver a cursor where we think — cannot be faked and is
 * not tested here. That is what tests/e2e/drag-and-drop.spec.js is for. Neither
 * test is sufficient alone, and neither duplicates the other.
 */

/** how tall every faked card is, in invented pixels */
export const CARD_HEIGHT = 60;

/**
 * Gives each card a rectangle, stacked one above the next, so that a test can
 * work out a y coordinate that lands in the top or the bottom half of any card.
 *
 * @param {HTMLElement[]} cards the cards, in the order they are drawn
 * @param {number} height how tall to pretend each one is
 */
export function stackCards(cards, height = CARD_HEIGHT) {
    cards.forEach((card, index) => {
        const top = index * height;
        card.getBoundingClientRect = () => ({
            top,
            bottom: top + height,
            height,
            left: 0,
            right: 400,
            width: 400,
            x: 0,
            y: top,
            toJSON() { return this; }
        });
    });
}

/**
 * @param {number} index which card
 * @param {number} height the height used when stacking
 * @return {number} a y coordinate in the TOP half of that card, i.e. a drop that
 * should land the dragged card before it
 */
export function yAboveMidlineOf(index, height = CARD_HEIGHT) {
    return (index * height) + (height * 0.25);
}

/**
 * @param {number} index which card
 * @param {number} height the height used when stacking
 * @return {number} a y coordinate in the BOTTOM half of that card, i.e. a drop
 * that should land the dragged card after it
 */
export function yBelowMidlineOf(index, height = CARD_HEIGHT) {
    return (index * height) + (height * 0.75);
}

/**
 * A stand in for the DataTransfer object a real drag carries. jsdom does not
 * provide one, and the application reads and writes three things on it.
 *
 * @return {Object}
 */
export function fakeDataTransfer() {
    const store = new Map();
    return {
        effectAllowed: 'none',
        dropEffect: 'none',
        setData(format, value) { store.set(format, String(value)); },
        getData(format) { return store.get(format) ?? ''; }
    };
}

/**
 * Dispatches one drag event, carrying both a cursor position and a dataTransfer.
 *
 * WHY THIS IS NOT JUST fireEvent.dragOver(card, { clientY })
 * ---------------------------------------------------------
 * jsdom does not implement DragEvent. Testing Library's fireEvent looks the
 * event type up in a table, finds DragEvent unavailable, and falls back to a
 * plain Event — which has no clientY, so the property is silently dropped and
 * every drop is judged against a cursor at y=0.
 *
 * That failure is quiet and convincing: the drag still "works", the card still
 * moves, and the tests that only check "did it move at all" still pass. Only the
 * test for the off-by-one adjustment notices, and it looks like an application
 * bug rather than a test one.
 *
 * Building a MouseEvent instead gets a real clientY, and React does not care
 * which constructor produced the event when it maps dragover to onDragOver.
 *
 * @param {Function} fireEvent Testing Library's fireEvent
 * @param {string} type dragstart, dragover, drop or dragend
 * @param {HTMLElement} element what the event is dispatched on
 * @param {Object} options clientY and dataTransfer
 */
export function dispatchDragEvent(fireEvent, type, element, { clientY = 0, dataTransfer } = {}) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientY });
    Object.defineProperty(event, 'dataTransfer', {
        value: dataTransfer ?? fakeDataTransfer()
    });
    fireEvent(element, event);
}
