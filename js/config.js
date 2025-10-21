/**
 * @file config.js
 * @description Contains all static configuration data for the application.
 * This acts as the central "rulebook" for game mechanics, balance, and definitions.
 */

// We import the condition functions here because this data structure is
// fundamentally coupled to the logic that evaluates it. This is a deliberate
// and clean way to link rules to their evaluation functions.
// Note: These will be implemented in a future `time.js` module.
import { isWitchingHour, isPeriod, isFullMoon, isYule, isMidsummer } from './services/time.js';

/**
 * Defines the time periods of the day, their start/end times in minutes from midnight,
 * and their peak spotting multiplier.
 * @type {object}
 */
export const TIME_PERIODS = {
    'Midnight':      { start: 0,        peak: 15,   end: 59,   multiplier: 2.5 }, // 00:00 - 00:59
    'Late Night':    { start: 60,       peak: 150,  end: 239,  multiplier: 2.0 }, // 01:00 - 03:59
    'Early Morning': { start: 240,      peak: 300,  end: 359,  multiplier: 1.4 }, // 04:00 - 05:59
    'Morning':       { start: 360,      peak: 420,  end: 539,  multiplier: 1.2 }, // 06:00 - 08:59
    'Day':           { start: 540,      peak: 720,  end: 1079, multiplier: 1.0 }, // 09:00 - 17:59
    'Evening':       { start: 1080,     peak: 1140, end: 1259, multiplier: 1.4 }, // 18:00 - 20:59
    'Night':         { start: 1260,     peak: 1350, end: 1439, multiplier: 2.2 }  // 21:00 - 23:59
};

/**
 * Global modifiers for spotting chances. These are the default values
 * that can be overridden on a per-monster basis.
 * @type {object}
 */
export const GLOBAL_MODIFIERS = {
    bonuses: {
        witchingHour: 0.15, // Additive bonus
        midnight: 0.07,
        fullMoon: 0.12,
        yule: 0.10,
        midsummer: 0.25
    },
    penalties: {
        day: 0.4,           // Multiplicative penalty
        earlyMorning: 0.6,
        evening: 0.6,
        night: 0.7,
        lateNight: 0.6
    },
    events: {
        halloween: 2.5      // Global multiplier for the event
    }
};

/**
 * A mapping of modifier names to their activation condition and display label.
 * The Monster class uses this to evaluate bonuses and penalties.
 * @type {object}
 */
export const MODIFIER_DEFINITIONS = {
    bonuses: {
        'witchingHour': { condition: isWitchingHour, label: "Witching Hour" },
        'midnight':     { condition: () => isPeriod('Midnight'), label: "Midnight" },
        'fullMoon':     { condition: isFullMoon, label: "Full Moon" },
        'yule':         { condition: isYule, label: "Yule Season" },
        'midsummer':    { condition: isMidsummer, label: "Midsummer" }
    },
    penalties: {
        'day':          { condition: () => isPeriod('Day'), label: "Daylight" },
        'evening':      { condition: () => isPeriod('Evening'),label: "Evening" },
        'earlyMorning': { condition: () => isPeriod('Early Morning'), label: "Early Morning" },
        'night':        { condition: () => isPeriod('Night'), label: "Night" },
        'lateNight':    { condition: () => isPeriod('Late Night'), label: "Late Night" }
    }
};

/**
 * Groups of GeoNames feature codes, allowing monsters to spawn in semantic locations
 * like "all forests" or "abandoned structures" instead of just specific codes.
 * @type {object}
 */
export const LOCATION_GROUPS = {
    // --- HUMAN SETTLEMENTS & STRUCTURES ---
    'settlements_urban': ['P.PPL', 'P.PPLA', 'P.PPLA2', 'P.PPLA3', 'P.PPLA4', 'P.PPLC', 'S.SQR'],
    'settlements_rural': ['P.PPLF', 'P.PPLL', 'S.FRM', 'S.FRMT', 'S.HUT', 'S.HUTS', 'L.LCTY'],
    'settlements_all': ['P.PPL', 'P.PPLA', 'P.PPLA2', 'P.PPLA3', 'P.PPLA4', 'P.PPLC', 'P.PPLF', 'P.PPLL'],
    
    'structures_affluent': ['S.PAL', 'S.CSTL', 'S.HSEC', 'S.EST'],
    'structures_abandoned': ['P.PPLH', 'P.PPLQ', 'P.PPLW', 'S.RUIN', 'R.RRQ', 'S.AIRQ', 'S.BDGQ', 'S.DAMQ', 'S.FRMQ', 'S.CMPQ', 'S.MLSGQ'],
    'structures_historic': ['A.ADM1H', 'A.ADM2H', 'A.ADM3H', 'A.ADM4H', 'L.BTL', 'S.ANS', 'S.HSTS', 'S.MNMT', 'S.WALLA', 'R.RDA'],
    'structures_defensive': ['S.FT', 'S.WALL', 'S.WALLA', 'S.TOWR', 'L.MILB', 'L.NVB', 'S.INSM'],
    'structures_industrial': ['S.MFG', 'S.ML', 'S.FNDY', 'S.PS', 'S.OILR', 'S.WTRW', 'S.DIKE', 'S.DAM', 'S.LOCK'],
    'structures_mines_quarries': ['S.MN', 'S.MNC', 'S.MNFE', 'S.MNAU', 'S.MNQ', 'S.MNQR', 'L.MNA'],

    // --- PLACES OF SPIRITUAL OR FINAL REST ---
    'places_of_worship': ['S.CH', 'S.MSQE', 'S.SYG', 'S.TMPL', 'S.PGDA', 'S.SHRN'],
    'places_of_seclusion': ['S.MSTY', 'S.CVNT', 'S.RLGR', 'S.HERM'],
    'places_of_death': ['S.CMTY', 'S.GRVE', 'S.TMB', 'S.BUR', 'L.BTL', 'S.WRCK'],
    'places_sacred_all': ['S.CH', 'S.MSQE', 'S.SYG', 'S.TMPL', 'S.PGDA', 'S.SHRN', 'S.MSTY', 'S.CVNT', 'S.RLGR', 'S.HERM', 'S.CMTY', 'S.GRVE', 'S.TMB', 'S.BUR', 'L.BTL', 'S.RLG'],

    // --- NATURAL ENVIRONMENTS: VEGETATION ---
    'forests_dense': ['V.FRST', 'V.FRSTF'],
    'forests_sparse': ['V.GROVE', 'V.HTH', 'V.SCRB', 'L.CLG'],
    'forests_all': ['V.FRST', 'V.FRSTF', 'V.GROVE', 'V.HTH', 'V.SCRB'],
    'cultivated_land': ['L.AGRC', 'V.CULT', 'L.FLDI', 'S.NSY', 'V.OCH', 'V.VIN'],
    'grasslands': ['V.GRSLD', 'V.MDW', 'L.GRAZ', 'L.PRK', 'L.CMN'],

    // --- NATURAL ENVIRONMENTS: TOPOGRAPHY & GEOLOGY ---
    'mountains_high': ['T.MT', 'T.MTS', 'T.PK', 'T.PKS', 'T.VLC', 'T.NTK'],
    'mountains_low': ['T.HLL', 'T.HLLS', 'T.RDGE', 'T.SPUR', 'T.UPLD', 'T.MESA'],
    'mountains_all': ['T.MT', 'T.MTS', 'T.PK', 'T.PKS', 'T.VLC', 'T.NTK', 'T.HLL', 'T.HLLS', 'T.RDGE', 'T.SPUR', 'T.UPLD'],
    'underground_natural': ['S.CAVE', 'S.BUR', 'R.TNLN', 'H.LKSB'],
    'canyons_and_gorges': ['T.CNYN', 'T.GRGE', 'T.VALG', 'T.RVN', 'T.FSR'],
    'rocky_terrain': ['T.RK', 'T.RKS', 'T.BLDR', 'T.SCRP', 'T.TAL', 'T.KRST', 'T.LAVA'],
    'deserts_and_barrens': ['T.DSRT', 'T.ERG', 'T.HMDA', 'T.REG', 'L.LAND', 'L.SALT', 'T.BDLD'],

    // --- NATURAL ENVIRONMENTS: WATER BODIES ---
    'water_freshwater_large': ['H.LK', 'H.LKS', 'H.RSV', 'H.LGN'],
    'water_freshwater_moving': ['H.STM', 'H.STMS', 'H.CNL', 'H.RPDS', 'H.FLLS'],
    'water_coastal': ['H.SEA', 'H.OCN', 'H.STRT', 'H.BAY', 'H.GULF', 'H.FJD', 'H.SD', 'T.BCH'],
    'water_islands': ['T.ISL', 'T.ISLS', 'T.ISLET', 'T.ATOL'],
    'water_wetlands': ['H.SWMP', 'H.MRSH', 'H.BOG', 'V.TUND', 'H.WTLD', 'L.PEAT'],

    // --- INFRASTRUCTURE ---
    'transport_roads': ['R.RD', 'R.ST', 'R.TRL', 'R.CSWY'],
    'transport_railways': ['R.RR', 'R.RSTN', 'R.RSTP', 'R.RYD'],
    'transport_bridges_tunnels': ['S.BDG', 'R.TNL', 'R.TNLRD', 'R.TNLRR'],
    'transport_hubs': ['S.AIRP', 'L.PRT', 'S.FYT', 'S.RSTN', 'S.BUSTN', 'S.MAR'],
};

/**
 * UI mapping for season names to icons.
 * @type {object}
 */
export const SEASON_ICONS = { 
    'Spring': '🌱',
    'Summer': '☀️',
    'Fall': '🍂',
    'Winter': '❄️' 
};