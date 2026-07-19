-- =============================================
-- ADD MAP FIELDS TO ORGANIZATIONS
-- =============================================

ALTER TABLE organizations
ADD COLUMN map_url TEXT,
ADD COLUMN province TEXT,
ADD COLUMN distance_km NUMERIC;
