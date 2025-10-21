/**
 * @file /utils/url.js
 * @description Manages synchronization between the application state and the browser URL hash.
 */

import { appState } from '../state.js';
import { getDateSeed } from '../services/time.js';
import { map } from '../ui/map.js';

/**
 * Reads the current application state (map view, date, filters) and
 * updates the browser's URL hash to reflect it.
 * Uses history.replaceState to avoid polluting browser history.
 */
export function updateUrlHash() {
    // Ensure the map has been initialized before trying to get its state.
    if (!map) return;

    const mapCenter = map.getCenter();
    const zoom = map.getZoom();
    const disabledMonsters = appState.monsters
        .filter(m => !m.state.isEnabled)
        .map(m => m.id)
        .join(',');
    
    const dateString = getDateSeed();

    const hashParts = [
        `lat=${mapCenter.lat.toFixed(4)}`,
        `lng=${mapCenter.lng.toFixed(4)}`,
        `zoom=${zoom}`,
        `date=${dateString}`
    ];

    if (disabledMonsters) {
        hashParts.push(`hide=${disabledMonsters}`);
    }

    // Use replaceState to update the URL without creating a new history entry.
    // This provides a much better user experience with the back/forward buttons.
    history.replaceState(null, '', `#${hashParts.join('&')}`);
}

/**
 * Parses the URL hash on application startup and applies the stored
 * state (map view, date, filters) to the application.
 */
export function parseUrlHash() {
    if (!window.location.hash) return;

    // Use URLSearchParams for robust parsing of the hash string.
    const params = new URLSearchParams(window.location.hash.substring(1));

    // Set map view from URL, ensuring all values are valid numbers.
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const zoom = parseInt(params.get('zoom'));
    if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom) && map) {
        map.setView([lat, lng], zoom);
    }

    // Set date from URL, validating the format to prevent errors.
    const dateStr = params.get('date');
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Create the date in UTC to avoid timezone-related "day off" errors.
        // The month in Date.UTC is 0-indexed, so we subtract 1.
        appState.currentDate = new Date(Date.UTC(year, month - 1, day));
    }

    // Set monster filters from URL.
    const hiddenMonsters = params.get('hide');
    if (hiddenMonsters) {
        const hiddenIds = new Set(hiddenMonsters.split(','));
        appState.monsters.forEach(m => {
            if (hiddenIds.has(m.id)) {
                m.state.isEnabled = false;
            }
        });
    }
}