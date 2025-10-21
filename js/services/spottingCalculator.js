/**
 * @file spottingCalculator.js
 * @description The core engine for calculating which monsters are spotted and where.
 * Note: This module relies on the `seedrandom` library being available in the global scope.
 */

import { appState } from '../state.js';
import { LOCATION_GROUPS } from '../config.js';
import { getDateSeed } from './time.js';

/**
 * Interprets a spotted count number into a human-readable likelihood string.
 * @param {number} count - The number of times a monster was spotted.
 * @returns {string} The likelihood category (e.g., 'Low', 'Medium').
 */
function getLikelihood(count) {
    if (count <= 0) return 'Very Low';
    if (count <= 2) return 'Low';
    if (count <= 5) return 'Medium';
    return 'High';
}

/**
 * Generates a list of geographic locations for a given number of monster sightings.
 * @param {Monster} monster - The monster instance to generate locations for.
 * @param {number} count - The number of locations to generate.
 * @param {function} rng - The seeded random number generator function.
 * @returns {Array<object>} An array of location objects with randomized lat/lng.
 */
function generateMonsterLocations(monster, count, rng) {
    if (count === 0) return [];
    
    const resolvedFeatureCodes = new Set();
    monster.locations.forEach(locIdentifier => {
        if (LOCATION_GROUPS[locIdentifier]) {
            LOCATION_GROUPS[locIdentifier].forEach(code => resolvedFeatureCodes.add(code));
        } else {
            resolvedFeatureCodes.add(locIdentifier);
        }
    });

    let locationPool = [];
    resolvedFeatureCodes.forEach(code => {
        if (code.includes('.')) { // Specific code like 'P.PPL'
            locationPool.push(...(appState.locationsByFeatureCode.get(code) || []));
        } else { // General class like 'T'
            locationPool.push(...(appState.locationsByFeatureClass.get(code) || []));
        }
    });

    if (locationPool.length === 0) return [];

    const monsterLocations = [];
    for (let i = 0; i < count; i++) {
        const baseLocation = locationPool[Math.floor(rng() * locationPool.length)];
        const spottedLocation = {
            ...baseLocation,
            // Add a small, deterministic jitter to the coordinates for visual variety
            lat: baseLocation.latitude + (rng() - 0.5) * 0.01,
            lng: baseLocation.longitude + (rng() - 0.5) * 0.01,
        };
        monsterLocations.push(spottedLocation);
    }
    return monsterLocations;
}

/**
 * The main calculation function. It iterates through all monsters, determines their
 * spotting chance, simulates sightings, and generates their locations.
 * @param {Array<Monster>} monsters - The array of Monster instances from the app state.
 * @returns {object} An object mapping monster IDs to their calculated spotting data.
 */
export function calculateSpottedMonsters(monsters) {
    const calculatedData = {};
    const dateSeed = getDateSeed();

    monsters.forEach(monster => {
        const monsterRNG = new Math.seedrandom(dateSeed + monster.id);
        const spottingData = monster.calculateSpottingData();
        
        if (spottingData.chance <= 0) {
            const isImpossible = spottingData.breakdown.some(step => step.type === 'impossible');
            calculatedData[monster.id] = {
                count: 0,
                locations: [],
                likelihood: isImpossible ? 'Impossible' : 'Very Low',
                currentChance: 0,
                breakdown: spottingData.breakdown,
                event: spottingData.event
            };
            return;
        }

        let spottedCount = 0;
        const maxSpotted = 40; // The maximum number of potential sightings to simulate
        for (let i = 0; i < maxSpotted; i++) {
            if (monsterRNG() < spottingData.chance) {
                spottedCount++;
            }
        }
        
        calculatedData[monster.id] = {
            count: spottedCount,
            locations: generateMonsterLocations(monster, spottedCount, monsterRNG),
            likelihood: getLikelihood(spottedCount),
            currentChance: spottingData.chance,
            breakdown: spottingData.breakdown,
            event: spottingData.event
        };
    });

    return calculatedData;
}