CREATE TABLE public.group_carts (
    table_number text PRIMARY KEY,
    cart_data jsonb DEFAULT '[]'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS but allow anonymous access for demo
ALTER TABLE public.group_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on group_carts" ON public.group_carts FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_carts;
