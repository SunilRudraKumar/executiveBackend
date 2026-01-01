const express = require('express');
const router = express.Router();
const pollingService = require('../services/pollingService');

// Route to manually trigger a poll (for testing)
router.get('/poll', async (req, res) => {
    try {
        const data = await pollingService.pollData();
        res.json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to poll data' });
    }
});

// Route to get stored data
router.get('/latest', (req, res) => {
    res.json(pollingService.getData());
});

module.exports = router;
