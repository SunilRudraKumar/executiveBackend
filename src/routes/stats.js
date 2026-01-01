const express = require('express');
const router = express.Router();
const statsService = require('../services/statsService');

/**
 * GET /api/stats/poll
 * Manually trigger a poll of the stats/balances stream
 */
router.get('/poll', async (req, res) => {
    try {
        const numMessages = parseInt(req.query.num) || 5;
        const data = await statsService.pollStatsStream(numMessages);
        res.json({
            success: true,
            message: `Polled stats stream`,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/stats
 * Get all stored statistics
 */
router.get('/', (req, res) => {
    const stats = statsService.getStats();
    res.json({
        count: stats.length,
        data: stats
    });
});

/**
 * GET /api/stats/balances
 * Get all stored balance/folio data
 */
router.get('/balances', (req, res) => {
    const balances = statsService.getBalances();
    res.json({
        count: balances.length,
        data: balances
    });
});

/**
 * GET /api/stats/summary
 * Get a summary of stats and balances data
 */
router.get('/summary', (req, res) => {
    const summary = statsService.getSummary();
    res.json(summary);
});

/**
 * GET /api/stats/latest
 * Get latest entries from both stats and balances
 */
router.get('/latest', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const stats = statsService.getStats().slice(-limit);
    const balances = statsService.getBalances().slice(-limit);

    res.json({
        stats: {
            count: stats.length,
            data: stats
        },
        balances: {
            count: balances.length,
            data: balances
        }
    });
});

module.exports = router;
