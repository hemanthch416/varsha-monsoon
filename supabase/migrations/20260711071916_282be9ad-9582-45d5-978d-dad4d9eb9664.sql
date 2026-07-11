INSERT INTO public.alerts (title, message, severity, status, region, starts_at, ends_at)
SELECT 'Heavy rainfall expected across Mumbai',
  'The IMD has issued a heavy rainfall advisory for coastal Maharashtra over the next 24 hours. Expect waterlogging in low-lying areas (Sion, Kurla, Hindmata). Commuters are advised to plan for delays and avoid non-essential travel after sunset.',
  'warning', 'before', 'Mumbai', now() - interval '1 hour', now() + interval '20 hours'
WHERE NOT EXISTS (SELECT 1 FROM public.alerts WHERE title = 'Heavy rainfall expected across Mumbai' AND region = 'Mumbai');

INSERT INTO public.alerts (title, message, severity, status, region, starts_at, ends_at)
SELECT 'Coastal wind advisory — Konkan',
  'Fishermen advised not to venture into the sea along the Konkan coast until winds subside. Squalls of 45–55 km/h likely.',
  'watch', 'before', 'Konkan', now() - interval '6 hours', now() + interval '12 hours'
WHERE NOT EXISTS (SELECT 1 FROM public.alerts WHERE title = 'Coastal wind advisory — Konkan' AND region = 'Konkan');