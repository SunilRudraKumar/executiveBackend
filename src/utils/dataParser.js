/**
 * Parses raw HotelKey stream events into a simplified structure.
 * @param {Array} events - List of raw events from the API
 * @returns {Array} - List of simplified objects
 */
const parseEvents = (events) => {
    if (!Array.isArray(events)) return [];

    return events.map(event => {
        // We only care about the payload for now
        const payload = event.payload || {};
        const type = payload.event_type;

        let simplified = {
            eventId: payload.event_id,
            type: type,
            timestamp: payload.event_time || new Date().toISOString(),
            hotelId: payload.property_id
        };

        if (type === 'RESERVATION' && payload.reservation) {
            const res = payload.reservation;
            const guest = res.guest_info || {};

            simplified.data = {
                reservationId: res.id,
                confirmationNumber: res.reservation_no,
                status: res.status,
                guestName: `${guest.first_name || ''} ${guest.last_name || ''}`.trim(),
                email: guest.email,
                phone: guest.phone,
                roomNumber: res.room_number,
                checkIn: res.check_in_date,
                checkOut: res.check_out_date,
                adults: res.adult_count,
                children: res.child_count
            };
        } else {
            // Fallback for other event types
            simplified.data = payload;
        }

        return simplified;
    });
};

module.exports = { parseEvents };
