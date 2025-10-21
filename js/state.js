/**
 * @file state.js
 * @description Centralized state management for the application.
 * This module provides the single source of truth for all dynamic data.
 * Other modules should import state from here rather than maintaining their own.
 */

/**
 * Holds the core state of the application, including loaded data,
 * user selections, and the current simulation date.
 * @type {object}
 */
export const appState = {
    monsters: [],
    currentDate: new Date(),
    allLocations: [],
    currentLocationFinderId: null,
    locationsByGeonameId: new Map(),
    locationsByFeatureCode: new Map(),
    locationsByFeatureClass: new Map(),
    adminHierarchy: { adm1: [] },
    spottedMonstersData: {},
    monsterLayers: {},
    featureCodeMap: new Map(),
    zoomIteratorState: {},
    zoomToMonsterControl: null
};

/**
 * Holds the state related to debugging and developer overrides.
 * This allows for forcing specific conditions for testing purposes.
 * @type {object}
 */
export const debugState = {
    multiplier: 1,
    forceTime: null,
    forceFullMoon: null,
    forceSeason: 'auto',
    forceHalloween: null
};