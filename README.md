# Executive Inn - HotelKey Integration Backend

Backend API for integrating with HotelKey PMS to poll reservation events, statistics, and balances.

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Reservation Stream
- `GET /api/stream/poll` - Manually poll the reservation stream
- `GET /api/stream/latest` - Get latest polled events

### Stats & Balances Stream
- `GET /api/stats/poll` - Poll stats/balances stream
- `GET /api/stats` - Get all statistics
- `GET /api/stats/balances` - Get all balance data
- `GET /api/stats/summary` - Get summary of both
- `GET /api/stats/latest` - Get latest entries

### Inventory
- `GET /api/inventory` - Get room inventory (requires Core API access)
- `GET /api/inventory/summary` - Get inventory summary

### Webhook
- `POST /api/webhook` - Receive push events from HotelKey
- `GET /api/webhook/latest` - View received webhook events

## Environment Variables

```env
HOST_URL=https://00.us-east-1.hkdemo.hotelkeyapp.com
APP_ID=your-app-id
API_PASSWORD=your-api-password
STATS_APP_ID=your-stats-app-id
STATS_API_PASSWORD=your-stats-api-password
PORT=3000
```

## Local Development

```bash
npm install
npm run dev
```

## Deployment

This project is configured for Render deployment. See `render.yaml`.

## Notes

- Stats & Balance events are only triggered after Night Audit
- Polling intervals: Main stream (10s), Stats stream (30s)
