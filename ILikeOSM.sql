--*** HowTo ***
--Notice: If you want to run your own ILikeOSM database, you need the following 
-- tables and function in a PostgresSQL/PostGIS database

-- Table for the latest views and likes
CREATE TABLE latest (
 tstamp timestamp without time zone NOT NULL,
 uuid text NOT NULL,
 status text NOT NULL,
 map text NOT NULL,
 zoom integer NOT NULL
);
SELECT AddGeometryColumn('','latest','the_geom','4326','POLYGON',2);
CREATE INDEX ilikeosm_idx_tstamp ON ilikeosm USING btree (tstamp );
CREATE INDEX ilikeosm_idx_uuid ON ilikeosm USING btree (uuid );
CREATE INDEX ilikeosm_idx_zoom ON ilikeosm USING btree (zoom );
CREATE INDEX ilikeosm_idx_the_geom ON ilikeosm USING gist (the_geom );

-- Table for all views and likes
CREATE TABLE history (
 tstamp timestamp without time zone NOT NULL,
 uuid text NOT NULL,
 status text NOT NULL,
 map text NOT NULL,
 zoom integer NOT NULL
);
SELECT AddGeometryColumn('','history','the_geom','4326','POLYGON',2);

-- Create function for table updates
DROP FUNCTION IF EXISTS update_latest(TEXT, TEXT, TEXT, INT, GEOMETRY);
CREATE FUNCTION update_latest(up_uuid TEXT, up_status TEXT, up_map TEXT, up_zoom INT, up_the_geom GEOMETRY) RETURNS VOID AS
$$
BEGIN
    LOOP
        -- first try to update the key
        UPDATE latest SET tstamp=now(),status=up_status,map=up_map,zoom=up_zoom,the_geom=up_the_geom WHERE uuid=up_uuid;
        IF found THEN
            RETURN;
        END IF;
        -- not there, so try to insert the key
        -- if someone else inserts the same key concurrently,
        -- we could get a unique-key failure
        BEGIN
            INSERT INTO latest (tstamp, uuid, status, map, zoom, the_geom) VALUES (now(), up_uuid, up_status, up_map, up_zoom, up_the_geom);
            RETURN;
        EXCEPTION WHEN unique_violation THEN
            -- Do nothing, and loop to try the UPDATE again.
        END;
    END LOOP;
END;
$$
LANGUAGE plpgsql;