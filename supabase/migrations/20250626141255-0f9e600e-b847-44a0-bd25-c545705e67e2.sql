
-- Enable real-time updates for payment_logs table
ALTER TABLE public.payment_logs REPLICA IDENTITY FULL;

-- Add the payment_logs table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_logs;
