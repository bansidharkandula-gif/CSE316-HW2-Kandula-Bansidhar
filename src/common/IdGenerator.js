/**
 * IdGenerator.js
 *
 * Every list and every list item needs an id that is unique, that survives being
 * written to local storage and read back weeks later, and that will not collide
 * with an id generated in another browser tab.
 *
 * Unchanged from HW1. React has nothing to say about generating ids, and this is
 * a good thing to notice: the parts of an application that have nothing to do
 * with the user interface do not change when the user interface is rewritten.
 */
export class IdGenerator {
    /**
     * @param {string} prefix a short tag so that ids stay readable while debugging
     * @return {string} a brand new unique id
     */
    static next(prefix = 'id') {
        if (globalThis.crypto?.randomUUID) {
            return `${prefix}-${globalThis.crypto.randomUUID()}`;
        }
        // fallback for the rare browser without crypto.randomUUID
        const random = Math.random().toString(36).slice(2, 10);
        return `${prefix}-${Date.now().toString(36)}-${random}`;
    }
}
