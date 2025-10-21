/**
 * @file /ui/listeners.js
 * @description Sets up global application event listeners that don't belong to a specific component.
 */

import { appState } from '../state.js';
import { updateUrlHash } from '../utils/url.js';
import { getDateSeed } from '../services/time.js';
import { map } from './map.js';

let redrawCallback = () => {};

/** Sets up the listener for the historical date input control. */
function setupHistoricalDateListener() {
    const dateInput = document.getElementById('historical-date');
    dateInput.value = getDateSeed(); // Set initial value on load
    
    dateInput.addEventListener('change', () => {
        const [year, month, day] = dateInput.value.split('-').map(Number);
        appState.currentDate = new Date(Date.UTC(year, month - 1, day));
        dateInput.value = getDateSeed();
        updateUrlHash();
        redrawCallback();
    });
}

/** Sets up the listener for the 'Share' button to copy the current URL. */
function setupShareButtonListener() {
    const shareButton = document.getElementById('share-button');
    shareButton.addEventListener('click', () => {
        updateUrlHash();
        navigator.clipboard.writeText(window.location.href).then(() => {
            shareButton.textContent = '✅ Copied!';
            setTimeout(() => { shareButton.textContent = '🔗 Share'; }, 2000);
        }).catch(err => {
            console.error('Failed to copy URL: ', err);
            alert('Failed to copy URL from address bar.');
        });
    });
}

/** Sets up the listener for the mobile-only map expander control. */
function setupMapExpanderListener() {
    const expanderBar = document.getElementById('map-expander');
    if (!expanderBar) return;
    
    expanderBar.addEventListener('click', () => {
        const center = map.getCenter();
        document.body.classList.toggle('map-fullscreen-mode');
        // Invalidate map size after the CSS transition to ensure it recalculates its dimensions.
        setTimeout(() => {
            map.invalidateSize();
            map.setView(center, map.getZoom(), { animate: false });
        }, 300); // This delay must match the transition duration in style.css
    });
}

/**
 * Initializes all core application event listeners.
 * @param {function} mainRedrawFunction The main redraw function to call after state changes.
 */
export function initializeListeners(mainRedrawFunction) {
    redrawCallback = mainRedrawFunction;
    
    setupHistoricalDateListener();
    setupShareButtonListener();
    setupMapExpanderListener();

    // Attach listener to update the URL hash whenever the map view changes.
    map.on('moveend', updateUrlHash);
}