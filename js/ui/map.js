/**
 * @file /ui/map.js
 * @description Manages all Leaflet map initialization, layers, and custom interactive controls.
 * This module encapsulates all logic related to the Leaflet.js library.
 */

import { appState } from '../state.js';
import { getLocationTypeName } from '../utils/helpers.js';

export let map;
let zoomToMonsterControl;

// --- Internal Helper Functions for the LocationFinder Control ---

/**
 * Finds the administrative parent of a given location object.
 * @param {object} location - The location object from allLocations.
 * @returns {object|null} The parent location object or null if at the top level.
 */
function findParent(location) {
    if (!location || !location.featureClass || location.featureClass !== 'A' || location.fullFeatureCode === 'A.ADM1') {
        return null;
    }
    const code = location.fullFeatureCode;
    // This logic finds the entity that matches the child's administrative codes one level up.
    if (code === 'A.ADM2') return appState.allLocations.find(l => l.fullFeatureCode === 'A.ADM1' && l.admin1 === location.admin1);
    if (code === 'A.ADM3') return appState.allLocations.find(l => l.fullFeatureCode === 'A.ADM2' && l.admin1 === location.admin1 && l.admin2 === location.admin2);
    if (code === 'A.ADM4') return appState.allLocations.find(l => l.fullFeatureCode === 'A.ADM3' && l.admin1 === location.admin1 && l.admin2 === location.admin2 && l.admin3 === location.admin3);
    return null;
}

/**
 * Updates the hierarchical region browser dropdown to reflect the currently selected location.
 */
function updateRegionBrowser() {
    const browserContainer = document.getElementById('region-browser');
    if (!browserContainer) return;
    browserContainer.innerHTML = '';

    const select = document.createElement('select');
    select.innerHTML = '<option value="">┌ Sweden</option>'; // Root element

    const currentLocation = appState.currentLocationFinderId ? appState.locationsByGeonameId.get(String(appState.currentLocationFinderId)) : null;

    // Build the ancestry path (e.g., Sweden -> Stockholm County -> Stockholm Municipality)
    const ancestry = [];
    if (currentLocation) {
        let p = findParent(currentLocation);
        while (p) {
            ancestry.unshift(p);
            p = findParent(p);
        }
    }

    // Find the direct children of the current location
    const children = [];
    if (!currentLocation) { // At root, children are ADM1 regions
        children.push(...appState.adminHierarchy.adm1);
    } else if (currentLocation.featureCode.startsWith('ADM')) {
        const level = parseInt(currentLocation.featureCode.replace('ADM', ''));
        if (level < 4) { // Find children for ADM1, ADM2, ADM3
            const nextLevelCode = `A.ADM${level + 1}`;
            children.push(...appState.allLocations.filter(l =>
                l.fullFeatureCode === nextLevelCode &&
                l.admin1 === currentLocation.admin1 &&
                (level < 2 || l.admin2 === currentLocation.admin2) &&
                (level < 3 || l.admin3 === currentLocation.admin3)
            ));
        }
    }
    children.sort((a, b) => a.name.localeCompare(b.name));

    // Render the UI
    ancestry.forEach((ancestor) => {
        const prefix = '├─' + '─'.repeat(ancestor.featureCode.replace('ADM', '') - 1) + ' ';
        select.add(new Option(prefix + ancestor.name, ancestor.geonameid));
    });

    if (currentLocation) {
        const prefix = (children.length > 0 ? '├─' : '└─') + '─'.repeat(ancestry.length) + ' ';
        select.add(new Option(prefix + currentLocation.name, currentLocation.geonameid));
    }

    if (children.length > 0) {
        children.forEach((child) => {
            const prefix = '└─' + '─'.repeat(ancestry.length) + ' ';
            select.add(new Option(prefix + child.name, child.geonameid));
        });
    }

    select.value = appState.currentLocationFinderId || "";
    select.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        zoomToLocation(selectedId ? appState.locationsByGeonameId.get(selectedId) : null);
    });

    browserContainer.appendChild(select);
}

/**
 * Zooms the map to a specific location, updates the application state, and resets the search UI.
 * @param {object|null} location The location object to zoom to, or null to zoom to the root.
 */
function zoomToLocation(location) {
    if (!location) {
        appState.currentLocationFinderId = null;
        map.setView([62.0, 15.0], 5);
    } else {
        appState.currentLocationFinderId = String(location.geonameid);
        let zoom = 5;
        switch (location.fullFeatureCode) {
            case 'A.ADM1': zoom = 7; break;
            case 'A.ADM2': zoom = 9; break;
            case 'A.ADM3': zoom = 11; break;
            case 'A.ADM4': zoom = 13; break;
        }
        map.setView([location.latitude, location.longitude], zoom);
    }
    updateRegionBrowser();

    // Reset search UI
    const searchInput = document.querySelector('.location-finder-search-input');
    const searchResults = document.getElementById('search-results');
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
}

/**
 * Handles user input in the location search box, filters locations, and displays results.
 */
function handleSearchInput() {
    const searchInput = document.querySelector('.location-finder-search-input');
    const resultsContainer = document.getElementById('search-results');
    const query = searchInput.value.toLowerCase();
    resultsContainer.innerHTML = '';

    if (query.length < 2) return;

    const allAdminLocations = appState.allLocations.filter(loc => loc.featureClass === 'A');
    let scoredResults = allAdminLocations.map(loc => {
        const name = loc.name.toLowerCase();
        let score = 0;
        if (name.startsWith(query)) score = 2;
        else if (name.includes(query)) score = 1;
        return { ...loc, score };
    }).filter(loc => loc.score > 0);

    scoredResults.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    const resultsToShow = scoredResults.slice(0, 5);
    resultsToShow.forEach(loc => {
        const li = document.createElement('li');
        li.textContent = `${loc.name} (${getLocationTypeName(loc)})`;
        li.addEventListener('click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            zoomToLocation(loc);
            L.DomUtil.removeClass(document.querySelector('.leaflet-control-location-finder'), 'expanded');
        });
        resultsContainer.appendChild(li);
    });
}

// --- Leaflet Custom Controls ---

/** The Leaflet control for finding and browsing administrative regions. */
const LocationFinder = L.Control.extend({
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-location-finder leaflet-bar');
        L.DomEvent.disableClickPropagation(container);

        container.innerHTML = `
            <div class="location-finder-content">
                <div class="location-finder-search-wrapper">
                    <input type="text" placeholder="Search locations..." class="location-finder-search-input">
                    <button class="location-finder-search-button"></button>
                </div>
                <ul id="search-results"></ul>
                <div class="region-browser-header">
                    <span>Browse Regions:</span>
                    <button id="region-browser-zoom-out" title="Zoom out to parent region"></button>
                </div>
                <div id="region-browser"></div>
            </div>
            <div class="location-finder-icons">
                <button class="location-finder-toggle"></button>
                <button class="location-finder-close"></button>
            </div>`;
        
        const openButton = container.querySelector('.location-finder-toggle');
        const closeButton = container.querySelector('.location-finder-close');
        const searchInput = container.querySelector('.location-finder-search-input');
        const zoomOutButton = container.querySelector('#region-browser-zoom-out');

        L.DomEvent.on(openButton, 'click', (e) => {
            L.DomEvent.stopPropagation(e);
            L.DomUtil.addClass(container, 'expanded');
            searchInput.focus();
        });
        L.DomEvent.on(closeButton, 'click', (e) => {
            L.DomEvent.stopPropagation(e);
            L.DomUtil.removeClass(container, 'expanded');
        });
        L.DomEvent.on(searchInput, 'input', handleSearchInput);
        L.DomEvent.on(zoomOutButton, 'click', () => {
            const current = appState.currentLocationFinderId ? appState.locationsByGeonameId.get(String(appState.currentLocationFinderId)) : null;
            zoomToLocation(findParent(current));
        });

        updateRegionBrowser(); // Populate the browser on initial creation
        return container;
    }
});

/** The Leaflet control for displaying buttons to cycle through spotted monsters. */
const ZoomToMonsterControl = L.Control.extend({
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-zoom-to-monster');
        L.DomEvent.disableClickPropagation(container);
        return container;
    },
    update: function() {
        const container = this.getContainer();
        if (!container) return;
        container.innerHTML = '';

        appState.monsters.forEach(monster => {
            const monsterInfo = appState.spottedMonstersData[monster.id];
            if (monster.state.isEnabled && monsterInfo && monsterInfo.count > 0) {
                if (appState.zoomIteratorState[monster.id] === undefined) {
                    appState.zoomIteratorState[monster.id] = 0;
                }
                const button = L.DomUtil.create('button', 'monster-zoom-btn', container);
                button.title = `Find next ${monster.name}`;
                button.innerHTML = `<div class="monster-zoom-icon-wrapper"><span class="monster-zoom-icon">${monster.icon}</span><svg class="monster-zoom-finder-svg" viewBox="0 0 24 24"><path d="M12 4C8.69 4 6 6.69 6 10C6 13.31 8.69 16 12 16S18 13.31 18 10C18 6.69 15.31 4 12 4ZM12 14C9.79 14 8 12.21 8 10S9.79 6 12 6 14 7.79 14 10 12.21 14 12 14Z"/><path d="M4 12H2C2 6.48 6.48 2 12 2V4C7.58 4 4 7.58 4 12Z"/><path d="M20 12H22C22 6.48 17.52 2 12 2V4C16.42 4 20 7.58 20 12Z"/><path d="M4 12C4 16.42 7.58 20 12 20V22C6.48 22 2 17.52 2 12H4Z"/><path d="M20 12C20 16.42 16.42 20 12 20V22C17.52 22 22 17.52 22 12H20Z"/></svg></div><span class="monster-zoom-count">${monsterInfo.count}</span>`;
                
                L.DomEvent.on(button, 'click', (e) => {
                    L.DomEvent.stop(e);
                    const monsterLayerData = appState.monsterLayers[monster.id];
                    if (!monsterLayerData || monsterLayerData.markers.length === 0) return;

                    const currentIndex = appState.zoomIteratorState[monster.id];
                    const targetLocation = monsterInfo.locations[currentIndex];
                    const markerToFind = monsterLayerData.markers[currentIndex];
                    
                    map.flyTo([targetLocation.lat, targetLocation.lng], 12, { duration: 1.5 });
                    map.once('moveend', () => {
                        monsterLayerData.group.zoomToShowLayer(markerToFind, () => markerToFind.openPopup());
                    });

                    appState.zoomIteratorState[monster.id] = (currentIndex + 1) % monsterInfo.locations.length;
                });
            }
        });
    }
});

/**
 * Clears and redraws all monster markers and cluster groups on the map.
 */
function updateMapMarkers() {
    // First, clear any existing layers.
    Object.values(appState.monsterLayers).forEach(layerData => map.removeLayer(layerData.group));
    appState.monsterLayers = {};

    appState.monsters.forEach(monster => {
        if (!monster.state.isEnabled) return;

        const spottedInfo = appState.spottedMonstersData[monster.id];
        if (!spottedInfo || spottedInfo.count === 0) return;

        const markerClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            spiderfyOnMaxZoom: true,
            iconCreateFunction: function(cluster) {
                return L.divIcon({
                    html: `<div class="monster-cluster-icon"><span class="cluster-monster-icon">${monster.icon}</span><span class="cluster-monster-count">${cluster.getChildCount()}</span></div>`,
                    className: 'monster-cluster',
                    iconSize: [30, 30]
                });
            }
        });

        const markerInstances = spottedInfo.locations.map(loc => {
            const icon = L.divIcon({
                html: `<div class="monster-marker">${monster.icon}</div>`,
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const locationTypeName = getLocationTypeName(loc).split(',')[0];
            const popupContent = `<b>${monster.name} Sighting!</b><br>Near: ${loc.name}<br>Habitat: ${locationTypeName}<br>Coords: ${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)}`;

            return L.marker([loc.lat, loc.lng], { icon: icon }).bindPopup(popupContent);
        });

        markerClusterGroup.addLayers(markerInstances);
        appState.monsterLayers[monster.id] = { group: markerClusterGroup, markers: markerInstances };
        map.addLayer(markerClusterGroup);
    });
}

// --- Public API for the Map Module ---

/**
 * Initializes the Leaflet map, adds tile layers, and creates all custom controls.
 * @returns {L.Map} The initialized Leaflet map instance.
 */
export function initializeMap() {
    if (map) return map; // Prevent re-initialization

    map = L.map('map', { zoomControl: false }).setView([62.0, 15.0], 5); // Disable default zoom
    L.control.zoom({ position: 'bottomright' }).addTo(map); // Add it back in a new position
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.addControl(new LocationFinder({ position: 'topleft' }));
    
    zoomToMonsterControl = new ZoomToMonsterControl({ position: 'topright' });
    map.addControl(zoomToMonsterControl);
    
    updateRegionBrowser();

    return map;
}

/**
 * The main update function for the map module. It redraws all dynamic elements.
 */
export function updateMap() {
    if (!map) return;
    updateMapMarkers();
    if (zoomToMonsterControl) {
        zoomToMonsterControl.update();
    }
}