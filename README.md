# Swedish Monster Spotter

Welcome to the Swedish Monster Spotter, an interactive web application that visualizes daily monster sightings across Sweden. This application uses a unique, deterministic simulation to create a consistent world for all users, where sightings are influenced by the date, time of day, season, moon phase, and special events.

## Features

*   **Deterministic Sightings:** Every user sees the same monster sightings for the same day, creating a shared, consistent world.
*   **Dynamic Simulation:** Spotting chances are dynamically calculated based on a rich set of conditions:
    *   **Time of Day:** Monsters are more active during their preferred periods (e.g., night, evening).
    *   **Seasons:** Some monsters only appear or are more common in specific seasons.
    *   **Celestial Events:** The full moon is a critical factor for certain creatures.
    *   **Special Events:** Look out for huge boosts on holidays like Halloween and Midsummer!
*   **Interactive Map:** Built with Leaflet.js, featuring marker clustering for performance and custom controls for finding monsters and browsing regions.
*   **Detailed Information:** Click on any monster in the filter panel to see a detailed breakdown of its current spotting chance.
*   **Shareable Views:** The application state (map position, date, and filters) is stored in the URL, allowing you to easily share your current view with others.
*   **Developer Debug Panel:** Click the main title to reveal a debug panel for forcing specific times, seasons, and events for testing purposes.

## How It Works: The Simulation Engine

The core of this application is a two-stage calculation engine that runs every time the date or filters are changed.

1.  **The Rules Engine (`monster.js`):** For each monster, the application first calculates a final "spotting probability". It starts with a base chance and applies a series of multipliers and bonuses based on the current conditions (time, season, moon phase, etc.).
2.  **The Simulation Engine (`spottingCalculator.js`):** This engine takes the final probability from the rules engine. Using a seeded pseudo-random number generator (based on the `YYYY-MM-DD` date), it simulates a number of "sighting rolls". This determines the exact count of monsters spotted and generates their geographic coordinates for display on the map.

This seeded, deterministic approach ensures that the "random" sightings are perfectly repeatable for any given day.

## Code Structure & Module Architecture

The application's JavaScript is organized into a modular structure to ensure a clean separation of concerns, making the codebase scalable and easy to maintain.

*   **`js/app.js`**: The main entry point. It orchestrates the entire application lifecycle, from data loading and initialization to triggering the main `recalculateAndRedraw` loop.

*   **`js/state.js`**: The single source of truth. It exports the `appState` and `debugState` objects, which hold all dynamic data for the application. No other module maintains its own state.

*   **`js/config.js`**: The application's "rulebook". This file contains all the static configuration data, such as time period definitions, global spotting modifiers, and the semantic grouping of location types (`LOCATION_GROUPS`).

*   **`js/monster.js`**: Defines the `Monster` class, which encapsulates the properties and logic for a single monster type. Its primary method, `calculateSpottingData`, is the "rules engine".

### Sub-directories:

*   **`js/services/`**: Contains the core logic and "brains" of the application, completely decoupled from the UI.
    *   `dataLoader.js`: Handles fetching all necessary JSON data.
    *   `spottingCalculator.js`: The "simulation engine" that determines the final count and location of spotted monsters.
    *   `time.js`: A critical module that manages all date and time calculations, correctly separating UTC-based logic (for determinism) from local time-based logic (for simulation).

*   **`js/ui/`**: Contains all modules responsible for manipulating the DOM and handling user interactions.
    *   `map.js`: Encapsulates all Leaflet.js map logic, including initialization, layers, markers, and custom controls.
    *   `monsterPanel.js`: Manages the interactive monster filter list and the mobile details modal.
    *   `header.js`: Controls the display of the current time, date, and status badges.
    *   `debugPanel.js`: Manages the developer debug panel.
    *   `listeners.js`: Sets up global event listeners.

*   **`js/utils/`**: A collection of small, pure, reusable helper functions.
    *   `url.js`: Manages the synchronization of the application state with the browser's URL hash.
    *   `helpers.js`: Provides utility functions for mapping data to CSS classes or icons.

## Licensing & Attribution

### Project License

The source code for the **Swedish Monster Spotter** application is licensed under the **MIT License**. You can find the full license text in the [LICENSE](LICENSE) file.

### Third-Party Libraries

This project utilizes several fantastic open-source libraries. Their licenses are listed below:

*   **[Leaflet](https://leafletjs.com/)**: Licensed under the [BSD 2-Clause "Simplified" License](https://github.com/Leaflet/Leaflet/blob/main/LICENSE).
*   **[Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)**: Licensed under the [MIT License](https://github.com/Leaflet/Leaflet.markercluster/blob/master/LICENSE).
*   **[seedrandom](https://github.com/davidbau/seedrandom)**: Licensed under the [MIT License](https://github.com/davidbau/seedrandom/blob/master/LICENSE).

### Data Sources

The application relies on the following data sources, and gives full attribution for their use:

*   **[GeoNames](https://www.geonames.org/)**: All geographic location data (`locations_se.json`, `featureCodes_sv.json`) is sourced from GeoNames. This data is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/).
*   **[OpenStreetMap](https://www.openstreetmap.org/copyright)**: The map tiles are provided by OpenStreetMap. © OpenStreetMap contributors. The application correctly displays this attribution on the map interface as required.