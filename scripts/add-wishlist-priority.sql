-- Add wishlist_priority column to user_fragrances
-- Run once in Supabase SQL Editor

ALTER TABLE user_fragrances
  ADD COLUMN IF NOT EXISTS wishlist_priority TEXT
  CHECK (wishlist_priority IN ('HIGH', 'MEDIUM', 'LOW'));
