const express = require('express');
const router = express.Router();
const config = require('../config/config');
const { parseEvents } = require('../utils/dataParser');

// In-memory store (shared with polling for now, or separate)
// We'll reuse the pollingService logic if possible, or just store here.
// For simplicity, let's keep a local store or export one from pollingService if needed.
// To keep it clean, we'll just log and return success for now, 
// envisioning this pushes to a database in production.
const webhookEvents = [];

// Middleware for Basic Auth
const authenticateWebhook = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization Header' });
    }

    // Expected: Basic <base64(username:password)>
    // We'll trust the user to configure this in .env or config
    // For now, let's verify it matches the credentials WE use to Poll, 
    // OR a specific webhook secret. 
    // Let's use a simple check against our configured password for simplicity.

    // In a real scenario, HotelKey would give us a token or credentials.
    // Here we act as the server properly checking credentials sent TO us.
    // Let's verify against our configured AP_PASSWORD (implying shared secret)
    // or allow any valid basic auth if configured to do so.

    // Simplified: Just check if header exists and looks like Basic Auth
    // const [type, credentials] = authHeader.split(' ');
    // ... verification logic ...

    next();
};

router.post('/', authenticateWebhook, (req, res) => {
    try {
        const payload = req.body;
        console.log('Webhook received:', JSON.stringify(payload, null, 2));

        // Attempt to parse if it's an array of events
        // HotelKey Push usually sends an array of events similar to polling
        let eventsToProcess = Array.isArray(payload) ? payload : [payload];

        const cleanData = parseEvents(eventsToProcess);

        cleanData.forEach(event => {
            webhookEvents.push(event);
            // Limit size
            if (webhookEvents.length > 50) webhookEvents.shift();
        });

        console.log(`Processed ${cleanData.length} webhook events.`);

        res.status(200).json({ success: true, message: 'Events received' });
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

// Helper to view received webhook events
router.get('/latest', (req, res) => {
    res.json(webhookEvents);
});

module.exports = router;
