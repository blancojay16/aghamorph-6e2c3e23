ALTER TYPE public.body_system RENAME VALUE 'skeletal' TO 'air_temperature';
ALTER TYPE public.body_system RENAME VALUE 'muscular' TO 'air_pressure';
ALTER TYPE public.body_system RENAME VALUE 'digestive' TO 'wind_speed';
ALTER TYPE public.body_system RENAME VALUE 'circulatory' TO 'wind_direction';
ALTER TYPE public.body_system RENAME VALUE 'respiratory' TO 'humidity';
ALTER TYPE public.body_system ADD VALUE IF NOT EXISTS 'rainfall';
ALTER TYPE public.body_system ADD VALUE IF NOT EXISTS 'cloud_cover';