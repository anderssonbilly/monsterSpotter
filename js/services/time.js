/**
 * @file time.js
 * @description Centralized module for all date, time, and celestial calculations.
 * It correctly separates the universal UTC date for deterministic calculations
 * from the user's local time for simulation and display.
 */

import { appState, debugState } from '../state.js';
import { TIME_PERIODS } from '../config.js';

// A constant for the spotting chance multiplier when a monster is active outside its preferred time.
const INACTIVE_TIME_PENALTY = 0.05;

/**
 * [UTC-BASED] Generates a deterministic seed string from the current application date (YYYY-MM-DD).
 * This MUST use UTC to ensure all users get the same seed for the same date.
 * @returns {string} The date seed.
 */
export const getDateSeed = () => {
    const d = appState.currentDate;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * [LOCAL-TIME-BASED] Gets the current time for the simulation.
 * It respects the debug 'forceTime' override. If not forced, it uses the user's
 * real system time but applies it to the selected universal application date.
 * @returns {Date} The current simulation time.
 */
export const getCurrentTime = () => {
    // Start with the universal date from the app state.
    const simulationTime = new Date(appState.currentDate);

    if (debugState.forceTime) {
        const [hours, minutes] = debugState.forceTime.split(':').map(Number);
        // setHours correctly interprets the time in the local context of the date object.
        simulationTime.setHours(hours, minutes, 0, 0);
    } else {
        // Get the user's real, local time.
        const now = new Date();
        // Apply the user's local time components to our universal date.
        simulationTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }
    return simulationTime;
};

/**
 * [LOCAL-TIME-BASED] Converts a Date object to the number of minutes past midnight in its local context.
 * @param {Date} time - The date object to convert.
 * @returns {number}
 */
const timeToMins = (time) => time.getHours() * 60 + time.getMinutes();

/**
 * [LOCAL-TIME-BASED] Determines the name of the current time period (e.g., 'Day', 'Night').
 * @returns {string} The name of the current period.
 */
export const getCurrentPeriodName = () => {
    const currentTimeInMins = timeToMins(getCurrentTime());
    for (const periodName in TIME_PERIODS) {
        const period = TIME_PERIODS[periodName];
        if (currentTimeInMins >= period.start && currentTimeInMins <= period.end) {
            return periodName;
        }
    }
    return 'Day'; // Fallback
};

/**
 * [LOCAL-TIME-BASED] Checks if the current time falls within a specific named period.
 * @param {string} periodName - The name of the period to check (e.g., 'Midnight', 'Day').
 * @returns {boolean} True if the current time is in the specified period.
 */
export const isPeriod = (periodName) => getCurrentPeriodName() === periodName;

/**
 * [LOCAL-TIME-BASED] Checks if the current time is considered 'dark'.
 * @returns {boolean}
 */
export const isDark = () => isPeriod('Evening') || isNight();

/**
 * [LOCAL-TIME-BASED] Checks if the current time is considered 'night' (21:00 - 05:59).
 * @returns {boolean}
 */
export const isNight = () => {
    const h = getCurrentTime().getHours();
    return h >= 21 || h < 6;
};

/**
 * [LOCAL-TIME-BASED] Checks if the current time is the 'witching hour' (00:00 - 00:59).
 * @returns {boolean}
 */
export const isWitchingHour = () => getCurrentTime().getHours() === 0;

/**
 * [UTC-BASED] Calculates the current moon phase icon for a given date.
 * @param {Date} date - The date for which to calculate the moon phase.
 * @returns {string} An emoji representing the moon phase.
 */
export const getMoonPhaseIcon = (date) => {
    const LUNAR_MONTH = 29.530588853;
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
    const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon.getTime()) / 86400000; // (1000 * 60 * 60 * 24)
    const phase = (daysSinceKnownNewMoon % LUNAR_MONTH) / LUNAR_MONTH;
    const moonIcons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    const index = Math.round(phase * 8) % 8;
    return moonIcons[index];
};

/**
 * [UTC-BASED] Checks if the current date is a full moon, respecting the debug override.
 * @returns {boolean}
 */
export const isFullMoon = () => {
    if (debugState.forceFullMoon !== null) return debugState.forceFullMoon;
    return getMoonPhaseIcon(appState.currentDate) === '🌕';
};

/**
 * [UTC-BASED] Checks if the current date is October 31st, respecting the debug override.
 * @returns {boolean}
 */
export const isHalloween = () => {
    if (debugState.forceHalloween !== null) return debugState.forceHalloween;
    const d = appState.currentDate;
    return d.getUTCMonth() === 9 && d.getUTCDate() === 31; // Month 9 is October
};

/**
 * [UTC-BASED] Checks if the current date is the summer solstice, June 21st.
 * @returns {boolean}
 */
export const isMidsummer = () => {
    const d = appState.currentDate;
    return d.getUTCMonth() === 5 && d.getUTCDate() === 21; // Month 5 is June
};

/**
 * [UTC-BASED] Checks if the current date is within December (the Yule season).
 * @returns {boolean}
 */
export const isYule = () => appState.currentDate.getUTCMonth() === 11; // Month 11 is December

/**
 * [UTC-BASED] Determines the current season based on the application date, respecting the debug override.
 * @returns {string} The name of the current season.
 */
export const getCurrentSeason = () => {
    if (debugState.forceSeason !== 'auto') return debugState.forceSeason;
    const month = appState.currentDate.getUTCMonth();
    if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'Summer'; // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'Fall';   // Sep, Oct, Nov
    return 'Winter'; // Dec, Jan, Feb
};

/**
 * [LOCAL-TIME-BASED] Calculates a time-based spotting multiplier for a monster.
 * Returns a value > 1.0 during active periods (peaking at the defined `multiplier`),
 * and a small penalty if the current time is not in any of the monster's active periods.
 * @param {Array<string>} monsterActiveTimes - An array of time period names (e.g., ['Night', 'Late Night']).
 * @returns {number} The calculated multiplier.
 */
export function getTimeMultiplier(monsterActiveTimes) {
    if (monsterActiveTimes.includes('any')) return 1.0;

    const currentTimeInMins = timeToMins(getCurrentTime());
    let highestMultiplier = 0;

    monsterActiveTimes.forEach(periodName => {
        const period = TIME_PERIODS[periodName];
        if (!period) return;

        if (currentTimeInMins >= period.start && currentTimeInMins <= period.end) {
            const maxBonus = period.multiplier - 1.0;
            let currentMultiplier;
            
            // Calculate position within the ramp-up or ramp-down phase
            if (currentTimeInMins <= period.peak) {
                const duration = period.peak - period.start;
                const progress = duration > 0 ? (currentTimeInMins - period.start) / duration : 1;
                currentMultiplier = 1.0 + maxBonus * Math.pow(progress, 2); // Squared for a non-linear curve
            } else {
                const duration = period.end - period.peak;
                const progress = duration > 0 ? (period.end - currentTimeInMins) / duration : 1;
                currentMultiplier = 1.0 + maxBonus * Math.pow(progress, 2);
            }

            if (currentMultiplier > highestMultiplier) {
                highestMultiplier = currentMultiplier;
            }
        }
    });

    return highestMultiplier === 0 ? INACTIVE_TIME_PENALTY : highestMultiplier;
}