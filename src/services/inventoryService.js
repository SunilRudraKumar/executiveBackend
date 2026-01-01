const axios = require('axios');
const config = require('../config/config');

const getAuthHeader = () => {
    const credentials = `${config.appId}:${config.apiPassword}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    return `Basic ${base64Credentials}`;
};

const getRoomInventory = async () => {
    try {
        // Endpoint: /room-inventory
        // Full Path: https://{host}/thirdparty/hotelbrand/properties/{property_id}/room-inventory
        // Note: The docs say <hostname>/<version>/<chain_identifier>/properties/<property_id>/room-inventory
        // We need to construct this. Based on polling URL "thirdparty/hotelbrand/stream/{app_id}/poll",
        // the pattern might be "thirdparty/hotelbrand/properties/{property_id}/room-inventory"
        // We will try this common pattern first.

        // However, looking at the provided logs/docs, the polling URL was:
        // {host}/thirdparty/hotelbrand/stream/{app_id}/poll

        // Property ID was provided in user request: 84626d8e-969c-4f06-b77a-a7a6dfc30cbf
        // We'll add this to config first.

        const propertyId = '84626d8e-969c-4f06-b77a-a7a6dfc30cbf';
        // Correct URL structure found via documentation:
        // https://{host}/v4/hotelbrand/properties/{property_id}/room-inventory
        const url = `${config.hostUrl}/v4/hotelbrand/properties/${propertyId}/room-inventory`;

        console.log(`Fetching Inventory: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });

        return response.data || [];
    } catch (error) {
        // Gracefully handle the known 403 Forbidden error
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            console.warn('Inventory API Access Denied. Requires valid PMS Core API credentials.');
            return {
                error: 'Access Denied',
                message: 'Inventory authentication failed. Please verify PMS API credentials.',
                status: 'DISABLED'
            };
        }
        console.error('Inventory fetch error:', error.response ? error.response.data : error.message);
        return { error: 'Inventory Fetch Failed' };
    }
};

const getInventorySummary = async () => {
    try {
        const rooms = await getRoomInventory();

        // If we got our error object back, pass it through
        if (rooms.error) return rooms;

        // Calculate basic stats
        // Note: The actual field names need to be verified from the API response.
        // Assuming common fields: status, housekeeping_status, occupancy_status

        const summary = {
            totalRooms: rooms.length,
            available: 0,
            occupied: 0,
            dirty: 0,
            outOfOrder: 0
        };

        if (Array.isArray(rooms)) {
            rooms.forEach(room => {
                // Logic based on typical PMS fields. 
                // We will refine this after seeing the first real response.
                const isOccupied = room.occupancy_status === 'Occupied' || room.status === 'Occupied';
                const isDirty = room.housekeeping_status === 'Dirty';
                const isOoo = room.status === 'OutOfOrder';

                if (isOoo) summary.outOfOrder++;
                else if (isOccupied) summary.occupied++;
                else if (isDirty) summary.dirty++;
                else summary.available++; // Vacant & Clean
            });
        }

        return summary;
    } catch (error) {
        return { error: 'Failed to generate summary' };
    }
};

module.exports = {
    getRoomInventory,
    getInventorySummary
};
