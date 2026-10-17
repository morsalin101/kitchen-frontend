# Khabar Koi prototype — functional dashboard update

## What's functional now

### Customer experience
- Browse, search, filter and sort meals.
- Add meals to cart, adjust/remove quantities, and proceed through the existing checkout flow.
- Newly added kitchen menu items appear in the customer menu.
- Kitchen pause prevents new cart additions and checkout submissions.
- Login/sign-up demo, profile/sign-out, local theme and language preferences, saved address, Google Maps preview, and order history remain in place.

### Kitchen dashboard sidebar
- **Overview:** summary metrics, incoming orders, schedule overview, and today's menu.
- **Menu items:** add, edit, delete, search/filter items, adjust portions, and pause/open availability. Menu changes persist in localStorage and are reflected in the customer menu.
- **Schedule:** edit meal-window start/end times and enable/disable windows; preferences persist in localStorage.
- **Orders:** advance prototype order statuses through Confirmed → Preparing → Ready → Delivered and export CSV.
- **Earnings:** see locally recorded order totals and download order reports.

### Admin dashboard sidebar
- **Overview:** summary metrics and working shortcuts to the relevant admin sections.
- **Kitchens:** search/filter, approve pending kitchens, suspend and restore kitchen entries.
- **All orders:** view orders, advance statuses, and export CSV.
- **Categories:** add/delete categories; changes update customer category filters and the kitchen item editor.
- **Users:** search/filter demo users and block/restore them.
- **Analytics:** inspect locally recorded order data and export reports.

## Run locally

From the project directory:

```bash
npm install
npm run dev
```

To verify a production build:

```bash
npx tsc --noEmit
npm run build
```

## Prototype limitations

This is still a frontend-only prototype. Menu entries, orders, schedules, users, theme, and preferences use browser `localStorage`. They are not synchronized between different browsers/devices and are not written to PostgreSQL or a backend API. The admin/kitchen demo entries are sample data. Authentication and payment are not production-secure or real payment processing.
