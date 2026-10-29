# Khabar Koi frontend prototype

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173/`, depending on `vite.config.ts`).

## Interactive prototype features

- Persistent light/dark theme switch.
- English/Bengali selector (saved in this browser).
- Demo sign-in and sign-up with form validation; passwords are not saved or sent anywhere.
- Persistent local cart and order history.
- Search, category, fulfilment, availability, and sorting filters.
- Delivery or pickup checkout, phone validation, location entry, and optional browser geolocation.
- GPS coordinates can be attached to a demo order after browser permission is granted.
- Google Maps previews appear in both the navbar delivery-location editor and checkout; typed addresses and GPS coordinates update the map, with a link to open the result in Google Maps.
- Simulated order confirmation and history.

## Important prototype limits

Google Maps uses an embedded Google Maps search preview (`google.com/maps?q=...&output=embed`), like the earlier prototype; it does not require a Maps API key or provide Places Autocomplete / draggable marker-to-address selection.

This is still a frontend-only prototype. Accounts, cart, address, settings, and order history live in the browser's local storage. Authentication is not secure server authentication, payment selections do not charge money, and orders are not sent to a kitchen or delivery service. A backend/API connection is required for production use.
