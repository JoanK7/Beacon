-- Runs once when the Postgres container is first created.
-- The main "beacon" database is created by POSTGRES_DB; this adds the test database.
CREATE DATABASE beacon_test OWNER beacon;
