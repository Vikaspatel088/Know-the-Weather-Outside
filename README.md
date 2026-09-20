# Know the Weather Outside

A coordinate-based smart weather application for global locations, including Indian towns, districts, villages, and postal-code searches where the provider can resolve them.

## Architecture

- React 19 + TypeScript + Vite frontend
- Small Node HTTP API in `server/server.mjs`
- Open-Meteo geocoding and forecast provider
- Coordinate-first location identity
- In-memory weather cache with a 10-minute TTL
- Rule-based weather insights with transparent provider metadata
- CSS/canvas weather visual engine
- Radar shown as unavailable until a verified radar tile provider is configured

## Run locally

```bash
npm install
npm run dev:full
```

The Vite frontend runs on port `5173` and proxies `/api` requests to the API on port `8787`.

## Production notes

The current provider supplies forecast and geocoding data without an API key. Official warnings, AQI, and radar tiles are intentionally not fabricated; they require a verified provider integration before being exposed as live data.
