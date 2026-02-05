-- Add specifications and is_trending columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS specifications text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false NOT NULL;

-- Add product_id column to quote_requests table for product quotes
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS product_specifications text DEFAULT NULL;