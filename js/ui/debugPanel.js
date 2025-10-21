/**
 * @file /ui/debugPanel.js
 * @description Manages the debug panel component, its internal state, and all its event listeners.
 * This module is responsible for modifying the global `debugState`.
 */

import { debugState } from '../state.js';

let redrawCallback = () => { console.warn('Redraw callback for debug panel not initialized.'); };
let timeInterval = null;

const debugPanel = document.getElementById('debug-panel');
const debugInput = document.getElementById('debug-multiplier');
const seasonSelect = document.getElementById('force-season');
const timeInput = document.getElementById('force-time');
const moonSelect = document.getElementById('force-full-moon-select');
const halloweenSelect = document.getElementById('force-halloween-select');
const timeIncrBtn = document.getElementById('time-incr');
const timeDecrBtn = document.getElementById('time-decr');
const resetBtn = document.getElementById('reset-debug-btn');

/**
 * Adjusts the time in the time input field by a given number of minutes.
 * It then dispatches an 'input' event to trigger the main state update logic.
 * @param {number} minutes - The number of minutes to add (can be negative).
 */
function adjustTime(minutes) {
    const currentTime = timeInput.value;
    const d = new Date(); // Use a temporary date object for calculation.

    if (!currentTime) {
        // If the input is empty, base the adjustment on the real current time.
        d.setMinutes(d.getMinutes() + minutes);
    } else {
        const [hours, mins] = currentTime.split(':').map(Number);
        d.setHours(hours, mins);
        d.setMinutes(d.getMinutes() + minutes);
    }

    const newHours = String(d.getHours()).padStart(2, '0');
    const newMinutes = String(d.getMinutes()).padStart(2, '0');
    timeInput.value = `${newHours}:${newMinutes}`;
    
    // Programmatically trigger the 'input' event to ensure the state is updated
    // and the main redraw function is called, just as if the user typed.
    timeInput.dispatchEvent(new Event('input'));
}

/**
 * Stops the time adjustment interval created by holding down a button.
 */
function stopAdjustingTime() {
    clearInterval(timeInterval);
}

/** Resets the debug state and UI controls to their default values and triggers a redraw. */
function resetDebugState() {
    // 1. Reset the internal state variables
    debugState.multiplier = 1;
    debugState.forceSeason = 'auto';
    debugState.forceTime = null;
    debugState.forceFullMoon = null;
    debugState.forceHalloween = null;

    // 2. Reset the UI controls to their default values
    debugInput.value = debugState.multiplier;
    seasonSelect.value = debugState.forceSeason;
    timeInput.value = '';
    moonSelect.value = 'null';
    halloweenSelect.value = 'null';

    // 3. Recalculate and redraw everything with the default settings
    redrawCallback();
}

/**
 * Initializes the debug panel, attaching all necessary event listeners.
 * @param {function} mainRedrawFunction - The main application redraw function to call after state changes.
 */
export function initializeDebugPanel(mainRedrawFunction) {
    redrawCallback = mainRedrawFunction;

    document.getElementById('main-title').addEventListener('click', () => {
        debugPanel.style.display = (debugPanel.style.display === 'block') ? 'none' : 'block';
    });

    debugInput.addEventListener('input', (e) => {
        const multiplier = parseFloat(e.target.value);
        if (!isNaN(multiplier) && multiplier >= 0) {
            debugState.multiplier = multiplier;
            redrawCallback();
        }
    });

    seasonSelect.addEventListener('change', () => {
        debugState.forceSeason = seasonSelect.value;
        redrawCallback();
    });

    moonSelect.addEventListener('change', () => {
        const value = moonSelect.value;
        debugState.forceFullMoon = value === 'null' ? null : JSON.parse(value);
        redrawCallback();
    });
    
    halloweenSelect.addEventListener('change', () => {
        const value = halloweenSelect.value;
        debugState.forceHalloween = value === 'null' ? null : JSON.parse(value);
        redrawCallback();
    });

    timeInput.addEventListener('input', () => {
        debugState.forceTime = timeInput.value || null;
        redrawCallback();
    });

    timeInput.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent the page from scrolling while adjusting time
        adjustTime(e.deltaY < 0 ? 1 : -1);
    });

    // Add listeners for holding down the time adjustment buttons (mouse and touch)
    [timeIncrBtn, timeDecrBtn].forEach(btn => {
        const adjustment = (btn === timeIncrBtn) ? 1 : -1;

        const startAdjusting = (e) => {
            e.preventDefault(); // Prevent scrolling on touch devices
            adjustTime(adjustment);
            clearInterval(timeInterval); // Ensure no lingering intervals
            timeInterval = setInterval(() => adjustTime(adjustment), 100);
        };

        btn.addEventListener('mousedown', startAdjusting);
        btn.addEventListener('mouseup', stopAdjustingTime);
        btn.addEventListener('mouseleave', stopAdjustingTime);
        btn.addEventListener('touchstart', startAdjusting, { passive: false });
        btn.addEventListener('touchend', stopAdjustingTime);
        btn.addEventListener('touchcancel', stopAdjustingTime);
    });
    
    resetBtn.addEventListener('click', resetDebugState);
}