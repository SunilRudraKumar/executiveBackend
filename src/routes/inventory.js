const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

router.get('/rooms', async (req, res) => {
    const data = await inventoryService.getRoomInventory();
    if (data.status === 'DISABLED') {
        res.status(403).json(data);
    } else {
        res.json(data);
    }
});

router.get('/summary', async (req, res) => {
    const data = await inventoryService.getInventorySummary();
    if (data.status === 'DISABLED') {
        res.status(403).json(data);
    } else {
        res.json(data);
    }
});

module.exports = router;
