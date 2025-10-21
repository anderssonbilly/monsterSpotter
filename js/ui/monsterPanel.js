/**
 * @file /ui/monsterPanel.js
 * @description Manages the interactive monster filter panel and the mobile details modal.
 */

import { appState } from '../state.js';
import { SEASON_ICONS } from '../config.js';
import { getLikelihoodClass, getLocationIcon } from '../utils/helpers.js';
import { updateMap } from './map.js';
import { updateUrlHash } from '../utils/url.js';

const monsterPanelContainer = document.getElementById('monster-filters');
const modalOverlay = document.getElementById('monster-modal-overlay');
const modalContent = document.getElementById('monster-modal-content');

/**
 * Generates the inner HTML for the expanded monster info panel or the modal.
 * @param {Monster} monster - The monster object for which to generate content.
 * @returns {string} An HTML string.
 */
function generateBreakdownContent(monster) {
    const spottedInfo = appState.spottedMonstersData[monster.id];
    let activityIcons = monster.activeSeasons.map(s => `<span>${SEASON_ICONS[s]}</span>`).join('');
    if (monster.activeTime.some(t => ['Night', 'Evening', 'Midnight'].includes(t))) activityIcons += '<span>🌙</span>';
    
    const uniqueLocIcons = new Set(monster.locations.map(code => getLocationIcon(code)));
    const locationIcons = Array.from(uniqueLocIcons).map(icon => `<span>${icon}</span>`).join('');

    let breakdownLines = [];
    if (spottedInfo.event === 'halloween') {
        breakdownLines.push("🎃 It's Halloween! 🎃", '--------------------------', 'All restrictions lifted!');
    } else {
        const impossibleStep = spottedInfo.breakdown.find(step => step.type === 'impossible');
        if (impossibleStep) {
            breakdownLines.push("Impossible to Spot!", '--------------------------', `Reason: ${impossibleStep.reason}`);
        }
    }

    if (breakdownLines.length === 0) {
        spottedInfo.breakdown.forEach((step, index) => {
            let line = '';
            switch (step.type) {
                case 'final': line = `${step.label}: ${(step.value * 100).toFixed(1)}%`; break;
                case 'base': line = `${step.label}: ${(step.value * 100).toFixed(1)}%`; break;
                case 'bonus': line = `${step.label}: Active (+${(step.value * 100).toFixed(0)}%)`; break;
                case 'penalty': line = `${step.label}: Active (x${step.value})`; break;
                case 'multiplier':
                    const prefix = step.subLabel ? `${step.label} (${step.subLabel})` : step.label;
                    const displayValue = step.value === 0.5 ? 'Inactive (÷2)' : `Active (x${step.value.toFixed(2)})`;
                    line = `${prefix}: ${displayValue}`;
                    break;
            }
            if (line) breakdownLines.push(line);
            if (step.type === 'final') breakdownLines.push('--------------------------');
        });
    }

    return `<div class="info-panel-header"><span class="icon">${monster.icon}</span><span class="name">${monster.name}</span></div><div class="info-panel-details"><div class="info-row"><span class="info-label" title="Most Active Conditions">Active:</span><span class="info-value">${activityIcons}</span></div><div class="info-row"><span class="info-label" title="Preferred Habitats">Habitats:</span><span class="info-value">${locationIcons}</span></div></div><div class="info-panel-breakdown"><span class="breakdown-title">Spotting Chance Breakdown</span><pre class="breakdown-code">${breakdownLines.join('\n')}</pre></div>`;
}

/** Hides the monster detail modal and clears its content. */
function hideMonsterModal() {
    modalOverlay.classList.add('hidden');
    modalContent.innerHTML = '';
}

/**
 * Populates and displays the monster detail modal with a specific monster's data.
 * @param {Monster} monster The monster object to display.
 */
function showMonsterModal(monster) {
    modalContent.innerHTML = `<button id="modal-close-btn">&times;</button>${generateBreakdownContent(monster)}`;
    modalOverlay.classList.remove('hidden');
    document.getElementById('modal-close-btn').addEventListener('click', hideMonsterModal);
}

/**
 * Handles a click on a monster row, deciding whether to expand in-place (desktop) or show a modal (mobile).
 * @param {Monster} monster The monster object that was clicked.
 * @param {HTMLElement} itemWrapper The top-level div for the monster item.
 */
function handleMonsterClick(monster, itemWrapper) {
    if (window.matchMedia("(max-width: 768px)").matches) {
        showMonsterModal(monster);
    } else {
        const isAlreadyExpanded = itemWrapper.classList.contains('expanded');
        const currentlyExpanded = document.querySelector('.monster-item.expanded');
        if (currentlyExpanded) currentlyExpanded.classList.remove('expanded');
        if (!isAlreadyExpanded) itemWrapper.classList.add('expanded');
    }
}

/**
 * Creates the static DOM structure for the monster panel. Runs once on startup.
 */
export function initializeMonsterPanel() {
    appState.monsters.forEach(monster => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'monster-item';
        itemWrapper.id = `monster-item-${monster.id}`;
        itemWrapper.innerHTML = `
            <div class="monster-row">
                <span class="monster-icon">${monster.icon}</span>
                <span class="monster-name">${monster.name}</span>
                <div class="monster-stats-group">
                    <div class="likelihood-circle"></div>
                    <span class="monster-spotted-count"></span>
                </div>
                <button class="visibility-toggle" title="Toggle visibility on map">
                    <span class="icon-visible">👁️</span>
                    <span class="icon-hidden">🚫</span>
                </button>
            </div>
            <div class="monster-info-panel"></div>`;
        monsterPanelContainer.appendChild(itemWrapper);

        const row = itemWrapper.querySelector('.monster-row');
        row.addEventListener('click', () => handleMonsterClick(monster, itemWrapper));

        const visibilityToggle = itemWrapper.querySelector('.visibility-toggle');
        visibilityToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Important: Prevent the row's click handler from firing
            monster.state.isEnabled = !monster.state.isEnabled;
            itemWrapper.classList.toggle('disabled', !monster.state.isEnabled);
            updateMap();
            updateUrlHash();
        });
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) hideMonsterModal();
    });
}

/**
 * Updates the monster panel with the latest data from the app state.
 */
export function updateMonsterPanel() {
    appState.monsters.forEach(monster => {
        const spottedInfo = appState.spottedMonstersData[monster.id];
        if (!spottedInfo) return;

        const itemWrapper = document.getElementById(`monster-item-${monster.id}`);
        const spottedCountEl = itemWrapper.querySelector('.monster-spotted-count');
        const likelihoodCircleEl = itemWrapper.querySelector('.likelihood-circle');
        const infoPanelEl = itemWrapper.querySelector('.monster-info-panel');

        spottedCountEl.textContent = `(${spottedInfo.count})`;
        likelihoodCircleEl.className = `likelihood-circle ${getLikelihoodClass(spottedInfo.likelihood)}`;
        likelihoodCircleEl.title = spottedInfo.likelihood;
        itemWrapper.classList.toggle('disabled', !monster.state.isEnabled);
        
        // Regenerate the content for the hidden desktop info panel
        infoPanelEl.innerHTML = generateBreakdownContent(monster);
    });
}