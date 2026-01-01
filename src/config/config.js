require('dotenv').config();

module.exports = {
    hostUrl: process.env.HOST_URL,
    appId: process.env.APP_ID,
    apiPassword: process.env.API_PASSWORD,
    port: process.env.PORT || 3000,

    // Stats and Balances Stream
    statsAppId: process.env.STATS_APP_ID,
    statsApiPassword: process.env.STATS_API_PASSWORD
};
