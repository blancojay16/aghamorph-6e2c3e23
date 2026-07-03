
-- Create new enum
CREATE TYPE public.body_system_new AS ENUM ('food_chain', 'herbivore', 'carnivore', 'omnivore');

-- Alter videos.system
ALTER TABLE public.videos
  ALTER COLUMN system TYPE public.body_system_new
  USING (
    CASE system::text
      WHEN 'air_temperature' THEN 'food_chain'
      WHEN 'air_pressure' THEN 'herbivore'
      WHEN 'wind_speed' THEN 'carnivore'
      WHEN 'wind_direction' THEN 'omnivore'
      WHEN 'humidity' THEN 'food_chain'
      WHEN 'rainfall' THEN 'herbivore'
      WHEN 'cloud_cover' THEN 'carnivore'
      ELSE 'food_chain'
    END
  )::public.body_system_new;

-- Alter game_assets.system
ALTER TABLE public.game_assets
  ALTER COLUMN system DROP DEFAULT,
  ALTER COLUMN system TYPE public.body_system_new
  USING (
    CASE system::text
      WHEN 'air_temperature' THEN 'food_chain'
      WHEN 'air_pressure' THEN 'herbivore'
      WHEN 'wind_speed' THEN 'carnivore'
      WHEN 'wind_direction' THEN 'omnivore'
      WHEN 'humidity' THEN 'food_chain'
      WHEN 'rainfall' THEN 'herbivore'
      WHEN 'cloud_cover' THEN 'carnivore'
      ELSE 'food_chain'
    END
  )::public.body_system_new;

-- Drop old and rename
DROP TYPE public.body_system;
ALTER TYPE public.body_system_new RENAME TO body_system;
