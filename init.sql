-- Brick Master Tracker — PostgreSQL initialisation script
-- Runs automatically on the first start of the db container.
-- Drizzle ORM (via @workspace/db) connects here; additional schema setup can
-- be added below as needed.

-- Ensure the application database exists (PostgreSQL auto-creates the default
-- db named by POSTGRES_DB, but we keep this here for explicitness).
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = current_database()) THEN
      CREATE DATABASE brickmaster;
   END IF;
END
$$;

-- Example: grant privileges to the application user (add other users here).
-- GRANT ALL PRIVILEGES ON DATABASE brickmaster TO postgres;
