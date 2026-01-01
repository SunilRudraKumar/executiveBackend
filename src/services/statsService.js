const axios = require('axios');
const config = require('../config/config');

// In-memory stores
let statsStore = [];
let balancesStore = [];

const getStatsAuthHeader = () => {
    const credentials = `${config.statsAppId}:${config.statsApiPassword}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    return `Basic ${base64Credentials}`;
};

/**
 * Poll Statistics and Balances stream
 * This uses the separate credentials provided for this specific stream
 */
const pollStatsStream = async (numMessages = 5) => {
    try {
        const url = `${config.hostUrl}/thirdparty/hotelbrand/stream/${config.statsAppId}/poll?num_of_messages=${numMessages}`;
        console.log(`Polling Stats Stream: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'Authorization': getStatsAuthHeader(),
                'Content-Type': 'application/json'
            }
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`Stats Stream: Received ${response.data.length} messages`);

            // Parse and categorize the events
            const parsedEvents = parseStatsEvents(response.data);

            return parsedEvents;
        } else {
            console.log('Stats Stream: No new messages');
            return { stats: [], balances: [], raw: [] };
        }
    } catch (error) {
        console.error('Stats Stream polling error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

/**
 * Parse statistics and balance events from the stream
 */
const parseStatsEvents = (events) => {
    const result = {
        stats: [],
        balances: [],
        raw: []
    };

    events.forEach(event => {
        try {
            // Handle string payload (newline-delimited JSON)
            if (typeof event === 'string') {
                const lines = event.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    try {
                        const parsed = JSON.parse(line);
                        categorizeEvent(parsed, result);
                    } catch (e) {
                        console.warn('Failed to parse line:', line.substring(0, 100));
                    }
                });
            } else if (typeof event === 'object') {
                categorizeEvent(event, result);
            }
        } catch (e) {
            console.warn('Failed to parse event:', e.message);
            result.raw.push(event);
        }
    });

    // Store the parsed data
    statsStore.push(...result.stats);
    balancesStore.push(...result.balances);

    // Keep stores manageable
    if (statsStore.length > 100) statsStore = statsStore.slice(-100);
    if (balancesStore.length > 100) balancesStore = balancesStore.slice(-100);

    return result;
};

/**
 * HotelKey Stats Stream Event Types (from documentation)
 */
const GUEST_RESERVATION_FIELDS = [
    'adults', 'children', 'total_guests', 'transient_in_house_guests',
    'group_in_house_guests', 'total_groups', 'booked_today', 'booked_room_nights_today',
    'booked_cancellations_today', 'cancelled', 'cancelled_reservations_arriving_today',
    'cancelled_with_penalty_reservations_arriving_today', 'checked_in_reservations',
    'departed_reservations', 'no_show', 'same_day_bookings', 'same_day_checkouts', 'stay_overs'
];

const ARRIVAL_DEPARTURE_FIELDS = [
    'total_arriving_guests', 'total_arrivals_tomorrow', 'total_departure_rooms_tomorrow',
    'total_guests_arriving_tomorrow', 'total_guests_departing_tomorrow'
];

const ROOM_STATUS_FIELDS = [
    'room_sold', 'room_sold_without_comp_rooms', 'room_available', 'room_vacant',
    'room_clean', 'room_dirty', 'clean_rooms', 'dirty_rooms', 'ready_rooms',
    'room_down', 'oos_rooms', 'oons_rooms', 'occupied_single_rooms_count',
    'occupied_double_rooms_count', 'comp_rooms', 'house_rooms', 'zero_rate'
];

const REVENUE_FIELDS = [
    'individual_room_revenue', 'individual_room_revenue_in_house',
    'group_master_room_revenue_in_house', 'average_daily_rate', 'adr_with_comp_room',
    'adr_without_comp_room', 'revenue_per_available_room_with_down_room',
    'revenue_per_available_room_without_down_room'
];

const OCCUPANCY_FIELDS = [
    'occupancy_percent_for_tomorrow', 'occupancy_percent_for_next_7_days',
    'occupancy_percent_for_next_14_days', 'occupancy_percent_for_next_31_days',
    'occupancy_percentage_with_down_rooms', 'occupancy_percentage_without_down_rooms'
];

const ALL_KNOWN_FIELDS = [
    ...GUEST_RESERVATION_FIELDS,
    ...ARRIVAL_DEPARTURE_FIELDS,
    ...ROOM_STATUS_FIELDS,
    ...REVENUE_FIELDS,
    ...OCCUPANCY_FIELDS
];

/**
 * Categorize an event into appropriate category
 */
const categorizeEvent = (event, result) => {
    const eventType = event.event_type || event.type || '';
    const payload = event.payload || event;

    // Common fields to extract
    const baseEvent = {
        id: event.id || event.event_id,
        timestamp: event.timestamp || event.created_at || new Date().toISOString(),
        eventType: eventType,
        propertyId: payload.property_id || payload.propertyId,
        propertyName: payload.property_name || payload.propertyName
    };

    // Check if this is a stats snapshot event (contains multiple metrics)
    const payloadKeys = Object.keys(payload);
    const matchedFields = payloadKeys.filter(key => ALL_KNOWN_FIELDS.includes(key));

    if (matchedFields.length > 0) {
        // This is a stats snapshot - extract all known metrics
        const statsEvent = {
            ...baseEvent,
            category: 'STATS_SNAPSHOT',
            metrics: {}
        };

        // Guest/Reservation metrics
        GUEST_RESERVATION_FIELDS.forEach(field => {
            if (payload[field] !== undefined) {
                statsEvent.metrics[field] = payload[field];
            }
        });

        // Arrival/Departure metrics
        ARRIVAL_DEPARTURE_FIELDS.forEach(field => {
            if (payload[field] !== undefined) {
                statsEvent.metrics[field] = payload[field];
            }
        });

        // Room status metrics
        ROOM_STATUS_FIELDS.forEach(field => {
            if (payload[field] !== undefined) {
                statsEvent.metrics[field] = payload[field];
            }
        });

        // Revenue metrics
        REVENUE_FIELDS.forEach(field => {
            if (payload[field] !== undefined) {
                statsEvent.metrics[field] = payload[field];
            }
        });

        // Occupancy metrics
        OCCUPANCY_FIELDS.forEach(field => {
            if (payload[field] !== undefined) {
                statsEvent.metrics[field] = payload[field];
            }
        });

        statsEvent.rawPayload = payload;
        result.stats.push(statsEvent);

        // Log a summary
        console.log(`Stats Snapshot: ${matchedFields.length} metrics captured`);
        console.log('Metrics:', JSON.stringify(statsEvent.metrics, null, 2));

        return;
    }

    // Check for balance/folio events
    const lowerType = eventType.toLowerCase();
    if (lowerType.includes('balance') || lowerType.includes('folio') ||
        lowerType.includes('payment') || lowerType.includes('charge') ||
        lowerType.includes('transaction')) {

        result.balances.push({
            ...baseEvent,
            guestName: payload.guest_name || payload.guestName,
            roomNumber: payload.room_number || payload.roomNumber,
            amount: payload.amount || payload.balance,
            currency: payload.currency || 'USD',
            folioId: payload.folio_id || payload.folioId,
            description: payload.description,
            rawPayload: payload
        });
        return;
    }

    // Check for other stat-related events by type name
    if (lowerType.includes('stat') || lowerType.includes('occupancy') ||
        lowerType.includes('revenue') || lowerType.includes('adr') ||
        lowerType.includes('revpar') || lowerType.includes('room')) {

        result.stats.push({
            ...baseEvent,
            metricName: eventType,
            value: payload.value || payload.amount,
            period: payload.period || payload.date,
            rawPayload: payload
        });
        return;
    }

    // Unknown type, store in raw but log it for debugging
    console.log('Unknown event type:', eventType, 'Keys:', Object.keys(payload).slice(0, 10));
    result.raw.push({
        ...baseEvent,
        rawPayload: payload
    });
};

/**
 * Get stored statistics data
 */
const getStats = () => statsStore;

/**
 * Get stored balances data
 */
const getBalances = () => balancesStore;

/**
 * Get combined summary
 */
const getSummary = () => {
    return {
        statsCount: statsStore.length,
        balancesCount: balancesStore.length,
        latestStats: statsStore.slice(-10),
        latestBalances: balancesStore.slice(-10),
        lastUpdated: new Date().toISOString()
    };
};

/**
 * Clear stored data (for testing)
 */
const clearData = () => {
    statsStore = [];
    balancesStore = [];
};

module.exports = {
    pollStatsStream,
    getStats,
    getBalances,
    getSummary,
    clearData
};
