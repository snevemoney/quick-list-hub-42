

# QuickMarket — Mobile-First Marketplace MVP

## Overview
A clean, deployed marketplace web app for your Upwork portfolio. Users sign up, post listings with images, browse/search, contact sellers, and go through a demo payment flow. Scoped tight for speed — no over-engineering.

---

## Phase 1: Backend Setup (Lovable Cloud)
- Enable Lovable Cloud for database, auth, and storage
- Create 4 tables: **profiles** (with `is_admin` boolean — no roles table), **listings**, **payments**, **messages**
- Create **listing-images** storage bucket
- RLS policies:
  - Public can read listings where `paid = true` AND `status = 'active'`
  - Only owners can insert/update/delete their own listings
  - Users read only their own messages (sent or received)
  - Users read only their own payments

## Phase 2: Authentication + Profiles
- Email magic link sign-up/sign-in
- Profile row created on first login via app logic (no trigger complexity)
- Auth guard on protected pages (Create Listing, My Listings, My Messages)

## Phase 3: Home / Listings Page
- Mobile-first card grid showing only **paid, active** listings
- Search bar (title/description)
- Category filter dropdown
- Sorted newest-first
- Tap card → Listing Details

## Phase 4: Listing Details Page
- Image carousel
- Title, price, category, city, description
- **"Contact Seller"** button → simple one-shot message form (writes to messages table, no threads, no inbox)
- If owner is viewing: Edit and Delete buttons

## Phase 5: Create Listing + Image Upload
- Authenticated form: title, description, price, category, city, multiple image uploads
- Images go to Supabase Storage bucket
- On submit: `paid = false`, `status = active`
- Redirect to payment step

## Phase 6: Payment Step (Demo Mock)
- "Pay Listing Fee to Publish" screen
- Button labeled **"Pay $5 (Demo)"** — clearly marked as demo
- On click: sets `listing.paid = true`, creates payments row with `status = 'paid_demo'`
- Clean and intentional — designed so real Stripe Checkout plugs in later
- Unpaid listings hidden from public browse, visible only to owner

## Phase 7: My Listings Page
- Shows logged-in user's listings (including unpaid)
- Status badges: **Unpaid** / **Active** / **Sold**
- Actions: Edit, Delete
- "Pay Now" button on unpaid listings → goes to payment step

## Phase 8: My Messages (Minimal)
- Simple list of received messages
- Each message shows: listing title, sender name, message text, timestamp
- No threads, no read states, no notifications — just a flat list proving the contact flow works

## Phase 9: Admin View (Optional, quick)
- If `profiles.is_admin = true`, show Admin link in nav
- Admin page: view all listings, hide or remove any listing
- No separate roles table — just a boolean flag

## Design Direction
- **Mobile-first**, clean, modern
- Green accent "Post Listing" CTA
- Loading skeletons and friendly empty states
- Responsive but phone-first (portfolio screenshots will be mobile)

