# Khabar Koi frontend update

## Run locally

1. Use Node.js 20.19+ (or 22.12+) for Vite 8.
2. Start the Spring Boot backend on `http://localhost:8080`.
3. In this directory, run `npm install` then `npm run dev`.
4. Vite proxies `/api` requests to `API_PROXY_TARGET` (defaults to `http://localhost:8080`). If your backend runs elsewhere, set `API_PROXY_TARGET` in your shell before starting Vite.

## Implemented frontend workflows

- Session-based login/logout and email OTP signup; no password/session token is stored in localStorage.
- Live public kitchens and food catalogue; search and category filtering.
- Backend cart, quantity changes, remove item and checkout using campus or custom delivery locations.
- Customer order history, per-kitchen order progress and order review submission.
- Kitchen owner applications, own kitchen details/availability, food image upload/edit/availability/delete, order accept/reject/progress.
- Admin user management, kitchen review/block/delete, campus location management and dashboard analytics.
- Responsive layout, light/dark theme, loading skeletons, inline spinners, accessible focus states and reduced-motion support.

## Backend contract note

The admin dashboard's sales graph calls `GET /api/v1/admin/analytics`. That endpoint is not present in the supplied backend snapshot, so apply the accompanying `KhabarKoi-admin-analytics-overlay.zip` to the backend source before using the dashboard. It aggregates sales from **completed orders only**; it does not invent demo sales.

The backend currently does not support pickup checkout or digital payment processing. The UI intentionally does not pretend those workflows are active. Checkout follows the current backend contract: selected cart item IDs, campus/custom delivery location, and delivery details.

## Verification

- `tsc --noEmit`: passed.
- Vite production build: passed.
- Runtime integration with a live PostgreSQL-backed Spring Boot server was not performed in this environment; verify login, OTP email, image uploads, checkout and admin actions against your local backend before deployment.
