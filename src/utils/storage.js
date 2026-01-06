const fs = require('fs');
const path = require('path');

// Storage directory - use a data folder in project root
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
const ensureDataDir = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('Created data directory:', DATA_DIR);
    }
};

/**
 * Load data from a JSON file
 * @param {string} filename - Name of the file (without path)
 * @param {any} defaultValue - Default value if file doesn't exist
 * @returns {any} Parsed data or default value
 */
const loadData = (filename, defaultValue = []) => {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);

    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(data);
            console.log(`Loaded ${Array.isArray(parsed) ? parsed.length : 'object'} entries from ${filename}`);
            return parsed;
        }
    } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
    }

    return defaultValue;
};

/**
 * Save data to a JSON file
 * @param {string} filename - Name of the file (without path)
 * @param {any} data - Data to save
 */
const saveData = (filename, data) => {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Saved ${Array.isArray(data) ? data.length : 'object'} entries to ${filename}`);
    } catch (error) {
        console.error(`Error saving ${filename}:`, error.message);
    }
};

/**
 * Append data to an existing array in a JSON file
 * @param {string} filename - Name of the file
 * @param {Array} newItems - Items to append
 * @param {number} maxItems - Maximum items to keep (oldest removed first)
 * @returns {Array} Updated array
 */
const appendData = (filename, newItems, maxItems = 500) => {
    let existing = loadData(filename, []);

    if (!Array.isArray(existing)) {
        existing = [];
    }

    existing.push(...newItems);

    // Trim to max size, keeping newest items
    if (existing.length > maxItems) {
        existing = existing.slice(-maxItems);
    }

    saveData(filename, existing);
    return existing;
};

// File names for different data types
const FILES = {
    EVENTS: 'events.json',
    STATS: 'stats.json',
    BALANCES: 'balances.json',
    WEBHOOK: 'webhook.json'
};

module.exports = {
    loadData,
    saveData,
    appendData,
    FILES,
    DATA_DIR
};
