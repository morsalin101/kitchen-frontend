# Khabar Koi role-based frontend architecture

This is an additive first pass. The existing customer storefront, cart, checkout, order history, theme/language settings, kitchen dashboard, admin dashboard, and demo interactions are preserved.

## Product roles

- **Buyer**: the existing customer storefront and buyer features. New users start here.
- **Seller**: an additional capability for a Buyer who submits a kitchen application. The account can continue ordering as a Buyer.
- **Admin**: a separate platform-management workspace. Its data and actions are still prototype/demo mode unless noted otherwise.

The `src/types/roles.ts` file maps the legacy internal values (`customer`, `kitchen`, `admin`) to the new product terms (`buyer`, `seller`, `admin`) so existing code and stored demo state remain compatible during migration.

## Seller application flow

1. A user chooses **Become a Seller** on the Buyer homepage or **Create a kitchen** from their profile.
2. The frontend submits the name and description to `POST /api/kitchens`.
3. The app stores the returned kitchen ID and application details in browser `localStorage` for this prototype.
4. `PENDING_REVIEW` and `REJECTED` applications display a separate Seller application-status page. Buyers can continue using the Buyer portal.
5. If the backend record is later changed to `ACTIVE`, refreshing the application allows the existing Kitchen Dashboard to be opened as the Seller workspace.

## Admin workspace

The existing Admin dashboard is preserved. Its existing sample-data management panels remain available, and a new **Connected database kitchens** panel lists the actual records returned by `GET /api/kitchens`.

The current backend does not yet provide an authenticated admin authorization flow or a real approve/reject endpoint. Therefore the connected database list is read-only; the UI deliberately does not pretend that local demo status changes modify PostgreSQL.

## Prototype limitations to resolve before production

- Demo sign-in is local/browser-only and is not real authentication.
- Kitchen creation currently uses test owner ID `1` because authentication and current-user lookup do not exist yet.
- Seller application records are stored in `localStorage`; the backend does not yet expose per-user kitchen applications.
- The workspace switch is a preview/navigation control, not a security boundary. Spring Boot must enforce Buyer/Seller/Admin permissions and resource ownership server-side.
- Admin approve/reject actions require a backend endpoint that updates kitchen status with an authorized administrator.

## Run locally

Keep the Spring Boot backend running on `http://localhost:8080`. In the frontend project, run:

```bash
npm install
npm run dev
```

Vite defaults to port `8443` in this project. The backend CORS origin must match the actual browser origin.
