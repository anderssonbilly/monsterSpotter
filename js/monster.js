/**
 * @file monster.js
 * @description Defines the Monster class, the core entity for all monster-related logic.
 */

import { debugState } from './state.js';
import { GLOBAL_MODIFIERS, MODIFIER_DEFINITIONS } from './config.js';
import { isHalloween, getCurrentSeason, getTimeMultiplier, getCurrentPeriodName, isFullMoon, isDark, isNight } from './services/time.js';

/**
 * Represents a single type of monster, containing all its properties and
 * the core logic for calculating its spotting chance under various conditions.
 */
export class Monster {
    /**
     * Initializes a new Monster instance.
     * @param {object} monsterData - The raw monster data loaded from monsters.json.
     */
    constructor(monsterData) {
        // Assign all properties from the JSON (id, name, icon, etc.) to this instance.
        Object.assign(this, monsterData);
        
        // Initialize the monster's state, which can be modified by the user (e.g., toggling visibility).
        this.state = { isEnabled: true };
    }

    /**
     * The core calculation logic for a single monster. It determines the final
     * spotting chance and generates a structured, pure-data breakdown of the calculation.
     * @returns {{chance: number, event: (string|null), breakdown: Array<object>}} An object containing the final chance, an optional event, and a breakdown array.
     */
    calculateSpottingData() {
        const breakdown = [];
        let chance = this.spottingChance;
        let event = null;

        if (isHalloween()) {
            const multiplier = GLOBAL_MODIFIERS.events.halloween;
            chance *= multiplier;
            event = 'halloween';
            breakdown.push({ type: 'multiplier', label: "Global Multiplier", value: multiplier });
        } else {
            const restriction = this._checkRestrictions();
            if (!restriction.met) {
                return {
                    chance: 0,
                    event: null,
                    breakdown: [{ type: 'impossible', reason: restriction.reason }]
                };
            }
            
            breakdown.push({ type: 'base', label: "Base Chance", value: this.spottingChance });

            const currentSeason = getCurrentSeason();
            if (!this.activeSeasons.includes(currentSeason)) {
                chance /= 2;
                breakdown.push({ type: 'multiplier', label: "Season", subLabel: currentSeason, value: 0.5 });
            }

            const timeMultiplier = getTimeMultiplier(this.activeTime);
            if (timeMultiplier !== 1.0) {
                chance *= timeMultiplier;
                breakdown.push({ type: 'multiplier', label: "Time", subLabel: getCurrentPeriodName(), value: timeMultiplier });
            }

            if (this.bonuses) {
                this.bonuses.forEach(bonusName => {
                    const bonusInfo = this._evaluateModifier(bonusName, 'bonuses');
                    if (bonusInfo.active) {
                        chance += bonusInfo.value;
                        breakdown.push({ type: 'bonus', label: bonusInfo.label, value: bonusInfo.value });
                    }
                });
            }

            if (this.penalties) {
                this.penalties.forEach(penaltyName => {
                    const penaltyInfo = this._evaluateModifier(penaltyName, 'penalties');
                    if (penaltyInfo.active) {
                        chance *= penaltyInfo.value;
                        breakdown.push({ type: 'penalty', label: penaltyInfo.label, value: penaltyInfo.value });
                    }
                });
            }
        }

        if (debugState.multiplier !== 1) {
            chance *= debugState.multiplier;
            breakdown.push({ type: 'multiplier', label: "Debug Multiplier", value: debugState.multiplier });
        }

        const finalChance = Math.max(0, Math.min(chance, 1));
        
        breakdown.unshift({ type: 'final', label: "Final Chance", value: finalChance });

        return { chance: finalChance, event, breakdown };
    }

    /**
     * Checks if all of the monster's hard restrictions (e.g., requires full moon) are met.
     * @private
     * @returns {{met: boolean, reason?: string}} An object indicating if restrictions are met and why not.
     */
    _checkRestrictions() {
        if (!this.restriction) return { met: true };

        const failed = [];
        const r = this.restriction;

        if (r.requiresFullMoon && !isFullMoon()) failed.push('Full Moon');
        if (r.requiresDark && !isDark()) failed.push('Darkness');
        if (r.requiresNight && !isNight()) failed.push('Night');
        
        return failed.length
            ? { met: false, reason: `Requires: ${failed.join(', ')}` }
            : { met: true };
    }

    /**
     * Evaluates a single named modifier (a bonus or penalty) to see if its
     * condition is met and returns its active state, value, and label.
     * @private
     * @param {string} modifierName - The name of the modifier (e.g., 'fullMoon').
     * @param {'bonuses'|'penalties'} type - The type of modifier to evaluate.
     * @returns {{active: boolean, value?: number, label?: string}}
     */
    _evaluateModifier(modifierName, type) {
        const definition = MODIFIER_DEFINITIONS[type]?.[modifierName];

        if (definition && definition.condition()) {
            const value = this.overrides?.[type]?.[modifierName] || GLOBAL_MODIFIERS[type][modifierName];
            return { active: true, value, label: definition.label };
        }
        return { active: false };
    }
}