const axios = require('axios');
const config = require('../config/config');
const { parseEvents } = require('../utils/dataParser');

let dataStore = []; // In-memory store for demo purposes

const getAuthHeader = () => {
    const credentials = `${config.appId}:${config.apiPassword}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    return `Basic ${base64Credentials}`;
};

const pollData = async () => {
    try {
        const url = `${config.hostUrl}/thirdparty/hotelbrand/stream/${config.appId}/poll?num_of_messages=1`;
        console.log(`Polling: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log('New data received:', response.data.length);

            // Parse the data using our new utility
            const cleanData = parseEvents(response.data);
            console.log('Parsed data:', JSON.stringify(cleanData, null, 2));

            dataStore.push(...cleanData);
            // Limit store size
            if (dataStore.length > 100) dataStore = dataStore.slice(-100);

            return cleanData;
        } else {
            console.log('No new messages.');
            return [];
        }
    } catch (error) {
        console.error('Polling error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = {
    pollData,
    getData: () => dataStore
};
