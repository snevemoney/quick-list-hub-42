-- Query indexes for list and FK lookups

CREATE INDEX IF NOT EXISTS listings_paid_status_created_at_idx
  ON public.listings (paid, status, created_at DESC);

CREATE INDEX IF NOT EXISTS listings_owner_id_created_at_idx
  ON public.listings (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_from_user_id_created_at_idx
  ON public.messages (from_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_to_user_id_created_at_idx
  ON public.messages (to_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_listing_id_idx
  ON public.messages (listing_id);

CREATE INDEX IF NOT EXISTS payments_user_id_idx
  ON public.payments (user_id);

CREATE INDEX IF NOT EXISTS payments_listing_id_idx
  ON public.payments (listing_id);
