-- Enable PostGIS cube extension (required by earthdistance)
CREATE EXTENSION IF NOT EXISTS cube;

-- Enable PostGIS earthdistance extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
