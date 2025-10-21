/**
 * @file app.js
 * @description The main entry point and orchestrator for the monster map application.
 * This module is responsible for initializing all other modules in the correct order,
 * managing the main calculation/redraw loop, and connecting all the pieces.
 * It assumes the presence of the `seedrandom` library in the global scope (from index.html).
 */

// --- 1. IMPORTS ---
// Import state management
import { appState } from './state.js';

// Import core logic and data structures
import { Monster } from './monster.js';
import { loadAllData, processLoadedData } from './services/dataLoader.js';
import { calculateSpottedMonsters } from './services/spottingCalculator.js';

// Import all UI module initializers and update functions
import { initializeMap, updateMap } from './ui/map.js';
import { initializeMonsterPanel, updateMonsterPanel } from './ui/monsterPanel.js';
import { updateHeader } from './ui/header.js';
import { initializeDebugPanel } from './ui/debugPanel.js';
import { initializeListeners } from './ui/listeners.js';

// Import utility functions
import { parseUrlHash } from './utils/url.js';


// --- 2. THE CORE REDRAW LOOP ---

/**
 * The central update function for the entire application.
 * It recalculates all monster spotting data based on the current state,
 * then calls the update functions for all UI components to redraw them.
 */
function recalculateAndRedraw() {
    // Reset any state that should not persist between calculations (e.g., zoom iterators)
    appState.zoomIteratorState = {};

    // Run the core calculation engine and update the state with the results
    appState.spottedMonstersData = calculateSpottedMonsters(appState.monsters);

    // Call the update function for each UI component to sync it with the new state
    updateMonsterPanel();
    updateMap();
    updateHeader();
}


// --- 3. APPLICATION INITIALIZATION ---

/**
 * The main asynchronous function that initializes the entire application.
 * It follows a strict sequence to ensure dependencies are met.
 */
async function initializeApp() {
    // 1. Show the loading indicator immediately for good UX.
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.classList.remove('hidden');

    // 2. Load all critical data from external files. Abort if this fails.
    const data = await loadAllData();
    if (!data) return; // Error handling is done inside loadAllData

    // 3. Process the raw data and populate the central appState.
    processLoadedData(data.locations, data.featureCodes);
    appState.monsters = data.monsters.map(monsterData => new Monster(monsterData));

    // 4. Initialize the map. This must happen before parsing the URL hash.
    initializeMap();

    // 5. Parse the URL hash to apply any shared state (map view, filters, date).
    // This needs the map and monsters to exist in the state first.
    parseUrlHash();

    // 6. Create the static DOM structures for UI components.
    initializeMonsterPanel();

    // 7. Attach all event listeners, passing them the main redraw function as a callback.
    // This connects user input to our state update loop.
    initializeListeners(recalculateAndRedraw);
    initializeDebugPanel(recalculateAndRedraw);
    
    // 8. Perform the initial calculation and render of the entire UI.
    recalculateAndRedraw();

    // 9. Start any ongoing processes, like the clock timer.
    // This updates the header every second independently of the main redraw loop for efficiency.
    setInterval(updateHeader, 1000);

    // 10. Hide the loading indicator with a small delay for a smooth transition.
    setTimeout(() => {
        loadingIndicator.classList.add('hidden');
    }, 500);
}

// --- 4. START THE APPLICATION ---
initializeApp();