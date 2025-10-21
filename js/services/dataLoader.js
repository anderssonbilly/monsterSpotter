/**
 * @file dataLoader.js
 * @description Handles fetching and initial processing of all external JSON data.
 */

import { appState } from '../state.js';

/**
 * Fetches all necessary JSON data files in parallel.
 * @returns {Promise<object|null>} A promise that resolves to an object containing the loaded data, or null on failure.
 */
export async function loadAllData() {
    try {
        const [locations, featureCodes, monsterData] = await Promise.all([
            fetch('data/locations_se.json').then(res => res.json()),
            fetch('data/featureCodes_sv.json').then(res => res.json()),
            fetch('data/monsters.json').then(res => res.json())
        ]);
        return { locations, featureCodes, monsters: monsterData };
    } catch (error) {
        console.error("Failed to load application data:", error);
        // This is an initialization-critical error. Direct DOM manipulation is acceptable here.
        const loadingText = document.querySelector('#loading-indicator p');
        if (loadingText) {
            loadingText.textContent = "Error: Could not load map data. Please try refreshing the page.";
        }
        return null;
    }
}

/**
 * Processes the raw loaded data and populates the application state with
 * structured Maps and arrays for efficient lookups.
 * @param {Array<object>} locations - The raw location data from locations_se.json.
 * @param {object} featureCodes - The raw feature code data from featureCodes_sv.json.
 */
export function processLoadedData(locations, featureCodes) {
    appState.featureCodeMap = new Map(Object.entries(featureCodes));

    appState.allLocations = locations.map(loc => ({
        ...loc,
        fullFeatureCode: `${loc.featureClass}.${loc.featureCode}`
    }));

    appState.allLocations.forEach(loc => {
        const geonameIdStr = String(loc.geonameid);
        appState.locationsByGeonameId.set(geonameIdStr, loc);

        if (!appState.locationsByFeatureCode.has(loc.fullFeatureCode)) {
            appState.locationsByFeatureCode.set(loc.fullFeatureCode, []);
        }
        appState.locationsByFeatureCode.get(loc.fullFeatureCode).push(loc);
        
        if (!appState.locationsByFeatureClass.has(loc.featureClass)) {
            appState.locationsByFeatureClass.set(loc.featureClass, []);
        }
        appState.locationsByFeatureClass.get(loc.featureClass).push(loc);
    });

    appState.adminHierarchy.adm1 = appState.locationsByFeatureCode.get('A.ADM1') || [];
}