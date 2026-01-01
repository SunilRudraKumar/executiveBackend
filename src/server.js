const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const dataRoutes = require('./routes/data');
const inventoryRoutes = require('./routes/inventory');
const webhookRoutes = require('./routes/webhook');
const statsRoutes = require('./routes/stats');
const pollingService = require('./services/pollingService');
const statsService = require('./services/statsService');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/stream', dataRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/stats', statsRoutes);

// Helper route to check health
app.get('/health', (req, res) => {
    res.send('Executive Inn Backend is running');
});

// Start polling interval for main stream (e.g., every 10 seconds)
setInterval(() => {
    pollingService.pollData().catch(err => console.error('Background poll failed'));
}, 10000);

// Start polling interval for stats stream (e.g., every 30 seconds)
setInterval(() => {
    statsService.pollStatsStream(5).catch(err => console.error('Stats poll failed'));
}, 30000);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    // Trigger one initial poll for both streams
    pollingService.pollData().catch(err => console.error('Initial poll failed'));
    statsService.pollStatsStream(5).catch(err => console.error('Initial stats poll failed'));
});

