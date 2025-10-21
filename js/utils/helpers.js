/**
 * @file /utils/helpers.js
 * @description A collection of small, pure, reusable utility functions for the application.
 */

import { appState } from '../state.js';

/**
 * Maps a monster spotting likelihood string to its corresponding CSS class name.
 * @param {string} likelihood - The likelihood string (e.g., 'High', 'Impossible').
 * @returns {string} The CSS class name for styling.
 */
export function getLikelihoodClass(likelihood) {
    switch (likelihood) {
        case 'Impossible': return 'likelihood-impossible';
        case 'High': return 'likelihood-high';
        case 'Medium': return 'likelihood-medium';
        case 'Low': return 'likelihood-low';
        default: return 'likelihood-vlow'; // Covers 'Very Low'
    }
}

/**
 * Returns a simple emoji icon based on a GeoNames feature code.
 * Used for providing quick visual context for monster habitats.
 * @param {string} code - The GeoNames feature code (e.g., 'P.PPL', 'V.FRST').
 * @returns {string} An emoji icon.
 */
export function getLocationIcon(code) {
    if (code.startsWith('P.')) return '🏙️';
    if (code.startsWith('V.FRST')) return '🌲'; // Handles both FRST and FRSTF
    if (code.startsWith('T.')) return '🏔️';
    if (code.startsWith('H.')) return '💧';
    if (code.startsWith('S.')) return '🏛️';
    return '❓';
}

/**
 * Gets the human-readable name for a location's feature type.
 * It first tries the specific feature code, then falls back to the general feature class.
 * @param {object} location - A location object from the application state.
 * @returns {string} The descriptive name of the location type (e.g., "Populated place", "Forest").
 */
export function getLocationTypeName(location) {
    if (!location) return 'Unknown';

    // 1. Try the most specific code first (e.g., "P.PPL" -> "Populated place").
    const specificInfo = appState.featureCodeMap.get(location.fullFeatureCode);
    if (specificInfo && specificInfo.name) {
        return specificInfo.name;
    }

    // 2. If not found, fall back to the general class (e.g., "P" -> "City, village,...").
    const generalInfo = appState.featureCodeMap.get(location.featureClass);
    if (generalInfo && generalInfo.name) {
        return generalInfo.name;
    }

    // 3. Final fallback if no information exists.
    return 'Area';
}