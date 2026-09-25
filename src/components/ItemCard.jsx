import { DateUtil } from '../common/DateUtil.js';
import { Priority } from '../model/listItem.js';
import IconButton, { DUPLICATE_GLYPH } from './IconButton.jsx';

const PRIORITY_STYLES = {
    [Priority.HIGH]: { accent: 'border-l-priority-high', text: 'text-priority-high' },
    [Priority.MEDIUM]: { accent: 'border-l-priority-medium', text: 'text-priority-medium' },
    [Priority.LOW]: { accent: 'border-l-priority-low', text: 'text-priority-low' }
};

export default function ItemCard({
    item,
    index,
    dropEdge = null,
    isBeingDragged = false,
    onOpen,
    onDuplicate,
    onDragStart,
    onDragEnd
}) {
    const styles = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES[Priority.LOW];
    const label = `Edit the item ${item.description}${item.completed ? ', completed' : ''}`;

    function handleKeyDown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen();
    }

    const dropClass = dropEdge === 'before' ? 'drop-before'
        : dropEdge === 'after' ? 'drop-after'
            : '';

    return (
        <li
            className={`item-card item-grid mt-2.5 cursor-pointer items-center gap-3 rounded-card
                        border-l-[0.3125rem] bg-sbu-white px-[0.875rem] py-2.5 shadow-card
                        transition-[box-shadow,transform,opacity] duration-150 first:mt-0
                        hover:-translate-y-px hover:shadow-card-hover
                        focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2
                        focus-visible:outline-sbu-red
                        ${styles.accent}
                        ${item.completed ? 'item-completed' : ''}
                        ${isBeingDragged ? 'opacity-50' : ''}
                        ${dropClass}`}
            data-item-id={item.id}
            data-index={index}
            role="button"
            tabIndex={0}
            aria-label={label}
            draggable
            onClick={onOpen}
            onKeyDown={handleKeyDown}
            onDragStart={(event) => onDragStart(index, event)}
            onDragEnd={onDragEnd}>

            <span className="area-handle cursor-grab text-center text-[1.125rem] leading-none
                             text-grey-300 select-none"
                  aria-hidden="true">
                ⠿
            </span>

            <span className={`item-description item-description-cell area-description min-w-0
                              truncate font-semibold
                              ${item.completed ? 'text-grey-500 line-through' : ''}`}>
                {item.description}
            </span>

            <span className="area-entered text-center text-[0.875rem] tabular-nums text-grey-700">
                {DateUtil.format(item.dateEntered)}
            </span>

            <span className={`area-priority text-center text-[0.875rem] font-bold ${styles.text}`}>
                {item.priority}
            </span>

            <span className="area-target text-center text-[0.875rem] tabular-nums text-grey-700">
                {DateUtil.format(item.targetDate)}
            </span>

            <span className="area-completed text-center text-[1.125rem] font-bold text-completed-mark"
                  aria-hidden="true">
                {item.completed ? '✓' : ''}
            </span>

            <div className="area-actions flex justify-end gap-1">
                <IconButton
                    action="duplicate-item"
                    label={`Duplicate the item ${item.description}`}
                    glyph={DUPLICATE_GLYPH}
                    onClick={onDuplicate} />
            </div>
        </li>
    );
}