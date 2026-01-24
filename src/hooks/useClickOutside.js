import { useEffect } from 'react';

/**
 * useClickOutside Hook
 * 
 * Triggers a callback when a click occurs outside the referenced element.
 * Useful for closing modals, dropdowns, menus, etc.
 * 
 * @param {React.RefObject} ref - The ref of the element to detect clicks outside of
 * @param {Function} handler - The callback function to execute on click outside
 * @param {boolean} enabled - Whether the listener is active (default: true)
 */
export const useClickOutside = (ref, handler, enabled = true) => {
    useEffect(() => {
        if (!enabled) return;

        const listener = (event) => {
            // Do nothing if clicking ref's element or descendent elements
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, enabled]);
};

export default useClickOutside;
