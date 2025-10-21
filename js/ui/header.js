/**
 * @file /ui/header.js
 * @description Manages the top header bar, displaying time, date, and status icons.
 * This module correctly displays the simulation time in the user's local timezone.
 */

import { appState, debugState } from '../state.js';
import * as time from '../services/time.js';

// Cache DOM elements for performance
const timeEl = document.getElementById('current-time');
const dayNightIconEl = document.getElementById('day-night-icon');
const periodBadge = document.getElementById('period-status');
const periodStatusTextEl = document.getElementById('period-status-text');
const witchingBadge = document.getElementById('witching-hour-status');
const moonBadge = document.getElementById('full-moon-status');
const halloweenBadge = document.getElementById('halloween-status');
const midsummerBadge = document.getElementById('midsummer-status');
const yuleBadge = document.getElementById('yule-status');

/**
 * Updates all elements in the header based on the current application state.
 */
export function updateHeader() {
    const now = time.getCurrentTime();

    timeEl.textContent = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    dayNightIconEl.textContent = (now.getHours() >= 6 && now.getHours() < 18) ? '☀️' : time.getMoonPhaseIcon(appState.currentDate);
    periodStatusTextEl.textContent = time.getCurrentPeriodName();
    periodBadge.classList.add('active');
    periodBadge.classList.toggle('forced', debugState.forceTime !== null);

    const isWitching = time.isWitchingHour();
    witchingBadge.classList.toggle('active', isWitching);
    witchingBadge.classList.toggle('forced', debugState.forceTime !== null && isWitching);
    
    const isFull = time.isFullMoon();
    moonBadge.classList.toggle('active', isFull);
    moonBadge.classList.toggle('forced', debugState.forceFullMoon !== null);

    const isHalloweenActive = time.isHalloween();
    halloweenBadge.classList.toggle('active', isHalloweenActive);
    halloweenBadge.classList.toggle('forced', debugState.forceHalloween !== null);

    midsummerBadge.classList.toggle('active', time.isMidsummer());
    yuleBadge.classList.toggle('active', time.isYule());
}