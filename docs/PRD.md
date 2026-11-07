# Mustan Tailoring Management System — Product Requirements (PRD)

## 1. Overview

A simple web platform for a small tailoring and clothing repair shop in the Netherlands (domain: kledingreparatie-mustan.nl).

Today the shop tracks orders with paper receipts. Receipts get lost, orders are hard to find, customers don't know when their clothes are ready, and the owner has no historical data.

This project replaces or complements the paper workflow with:
1. A public business website.
2. A fast order management panel for the owner.
3. A no-account order tracking page for customers (via QR code / secure link).

**Key constraint:** the owner and many customers are older and not very comfortable with technology. Simplicity beats features.

**Product principle:** adapt to the owner's existing workflow (receipts, order numbers, simple statuses) instead of forcing a new one. Paper stays as a backup during the first period.

## 2. Users

### 2.1 Business owner (internal user)
Must be able to: create an order in seconds, complete details later, search/filter orders, change status, generate a QR/tracking link, prepare a WhatsApp message, see simple statistics.

### 2.2 Customer (public, no account)
Must be able to: open the tracking page via QR code or secure link and see the order number, status, status timeline, estimated completion date and pickup info. Nothing else.

## 3. Current workflow (as-is)
1. Customer brings clothing and explains the work.
2. Owner accepts it and writes a small paper receipt.
3. One copy goes to the customer, one stays with the owner.
4. Clothing is processed.
5. Customer returns to collect it.

## 4. Proposed workflow (to-be)
1. Customer arrives; owner creates an order with only **name + phone**. Order gets a number (e.g. #1048) and a secure tracking token.
2. System generates a QR code / tracking link for the order.
3. Owner gives the customer the number and QR (printed on the receipt, or sent by WhatsApp link if there is no printer). A matching number tag goes on the garment.
4. Owner completes details later (service, notes, price, estimated date).
5. Owner updates the status as work progresses.
6. Customer can scan the QR to check status at any time (optional for the customer).
7. When ready, owner opens a pre-written WhatsApp message to the customer.

The customer never has to create the order. The QR is only for **tracking**.

## 5. Order creation principle
Order creation must be optimized for speed. The owner may be busy with a customer.

- **Required:** customer name, phone number.
- **Optional, editable later:** service, clothing type, description, measurements, internal note, price, estimated completion date.
- The system must never force the owner to fill every field before creating an order.
- Phone numbers are normalized to international format on save (e.g. +31 6..., +90 5...) so WhatsApp links work. Numbers from the Netherlands and Turkey must both work.

## 6. Order data

### 6.1 Notes: two separate fields
- **Internal note** (owner only): detailed instructions, measurements, reminders. Examples: "Shorten sleeves by 3 cm", "Replace zipper with black zipper", "Keep original button". Never shown publicly.
- **Public description** (optional, short): what the customer may see, e.g. "Trouser hem". Shown on the tracking page.

### 6.2 Services
Service is chosen from a predefined list (with an "Other" option), not typed freely, so analytics stay clean. The owner can manage the list. Details go in the notes.

Initial list (to be confirmed with the owner, with real prices):
- Trouser hem / shortening
- Sleeve shortening
- Waist adjustment
- Zipper replacement
- Jacket alteration
- General repair (tears, buttons, seams)
- Leather repair (jackets, bags)
- Down jacket repair (burns, tears)
- Dry cleaning (stomerij)
- Other

### 6.3 Status
Statuses: `RECEIVED`, `IN_PROGRESS`, `READY_FOR_PICKUP`, `DELIVERED`, `CANCELLED`.

**Every status change is stored with a timestamp** (status history). This is required for the status timeline and for average completion time. Do not only store the current status.

## 7. Incomplete orders
Orders created quickly may miss important fields (service, price, estimated date). The dashboard shows an "Incomplete orders" section listing the order and what is missing. Creation is never blocked.

## 8. Customer tracking & privacy
- No customer accounts, passwords, or login.
- Public URL uses a secure random token: `/track/<token>`. Never sequential IDs.
- Tracking pages are marked `noindex` (not searchable by Google).
- Public page shows only: order number, first name only, public description, service, status, timeline, estimated date, shop pickup info. **Never** phone number, internal note, price details, or other customers' data.
- Tracking by order number alone is NOT allowed (numbers are guessable). If added later it needs a second check (e.g. last 4 digits of the phone).
- Treat customer data under GDPR (AVG in the Netherlands): collect only what is needed, include a short privacy page, restrict database access.

## 9. Languages
Supported: Dutch (default for the public website), Turkish, English.
- All user-facing text lives in central translation files, never hard-coded in components.
- Prototype: Dutch and Turkish fully translated; English can follow later (structure must already support it).
- Dutch texts must be reviewed by a native/fluent Dutch speaker before the real launch.

## 10. Public website
- **Home:** short introduction, main services, call to action, "Track your order" button, contact info.
- **Services:** service list (prices as "from" prices once confirmed).
- **How it works:** 1) bring clothing, 2) we register your order, 3) track online, 4) pick up when ready.
- **Contact:** address, phone, opening hours, map link, WhatsApp, Facebook and Instagram buttons. No email address.
- **Business partners:** logos of the shops the owner works with, each linking to that shop's website.
- **Look and feel:** close to the existing site (kledingreparatie-mustan.nl): large photos, Vidaloka headings (like the shop sign), elegant palette. Stock photos until the owner provides his own.
- Language switcher.

## 11. Admin panel
Login (owner only), then:
- **Dashboard:** orders needing attention, in progress, ready for pickup, recent orders, incomplete orders.
- **Orders list:** search, filter by status, open details.
- **Create order:** the quick form (name + phone).
- **Order detail/edit:** all fields, status buttons, QR/tracking link, WhatsApp message button.
- Large buttons, mobile first (the owner may use a phone or tablet in the shop).

## 12. WhatsApp (prototype)
No WhatsApp Business API. The owner presses a button and a WhatsApp chat opens (`wa.me` link) with a pre-written message in the customer's language. The owner only presses send. Full API integration is a possible later phase and may cost money.

## 13. Analytics (later phase)
Simple reports on a separate page: orders per day/week/month/year, revenue, most requested services, orders by status, average completion time.
Analytics quality depends on data entry quality, which is why service and price should be quick to enter.
Material/inventory tracking is a possible later step, not part of the first versions.

## 14. Backup plan
If the internet is down, the shop continues with paper receipts. Paper is not removed during the first weeks of real use; both run in parallel.

## 15. Future features (NOT in prototype)
WhatsApp Business API, email notifications, inventory/material tracking, customer history, PDF receipts, staff accounts, photo attachments, Excel export, automatic reminders, advanced analytics.

## 16. Prototype definition (first milestone)
Goal: show the user experience to the owner and collect feedback. Mock/demo data is fine.

- Public: home, services, contact, language switcher, tracking page with status timeline.
- Admin: login screen (UI), dashboard, orders list, create order, edit order, order detail, status change.
- QR code generation for an order.
- WhatsApp message preparation.

Flow to demonstrate: Public site → Admin login → Dashboard → Create order → Order detail → QR → Customer tracking.

## 17. UX principles
Simplicity over functionality. Minimize clicks. Clear labels, no technical terms. Large touch-friendly buttons. Mobile first, desktop compatible. Only subtle animations (gentle fade-in on scroll, hover effects); no auto-playing sliders; animations are disabled when the device asks for reduced motion. Important information visible immediately.

## 18. Open questions (to ask the owner)
- Real service list and prices.
- Opening hours, address, phone, WhatsApp number.
- Which device he will use in the shop (phone, tablet, computer)? Is there a printer?
- Roughly how many orders per day?
- Who owns the domain and hosting today?
