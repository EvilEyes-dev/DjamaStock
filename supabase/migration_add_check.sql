-- Run this in Supabase SQL editor if your database already exists
ALTER TABLE products ADD CONSTRAINT products_quantity_non_negative CHECK (quantity >= 0);
