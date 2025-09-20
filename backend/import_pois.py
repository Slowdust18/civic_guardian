# backend/import_pois.py
import fiona
from sqlalchemy import create_engine, text
from shapely.geometry import shape
import os

# --- IMPORTANT: CONFIGURE THESE TWO VARIABLES ---
DB_URL = "postgresql+psycopg2://civic_user:1234@localhost/civic_guardian"
SHAPEFILE_PATH = "C:\\Users\\slowd\\OneDrive\\Documents\\western-zone-250918-free.shp\\gis_osm_pois_a_free_1.shp"
# Example: "C:\\Users\\slowd\\OneDrive\\Documents\\western-zone-250918-free.shp\\gis_osm_pois_a_free_1.shp"


TARGET_POIS = [
    'hospital', 'clinic', 'doctors', 'nursing_home', 'pharmacy', 'fire_station',
    'police', 'school', 'college', 'university', 'kindergarten', 'park',
    'playground', 'community_centre', 'library', 'monument', 'archaeological',
    'museum', 'water_tower', 'water_well',
]

def run_import():
    if not os.path.exists(SHAPEFILE_PATH):
        print(f"🔥 FATAL ERROR: The shapefile was not found at the path specified.")
        print(f"Please check the SHAPEFILE_PATH variable in this script.")
        return

    print("Connecting to the database...")
    engine = create_engine(DB_URL)
    pois_to_insert = []

    print(f"Reading shapefile from {SHAPEFILE_PATH}...")
    try:
        with fiona.open(SHAPEFILE_PATH, 'r') as source:
            for feature in source:
                poi_type = feature['properties'].get('fclass')
                if poi_type in TARGET_POIS:
                    geom = shape(feature['geometry'])
                    geom_wkt = None

                    # --- NEW LOGIC TO HANDLE DIFFERENT GEOMETRY TYPES ---
                    if geom.geom_type == 'Point':
                        geom_wkt = f"SRID=4326;{geom.wkt}"
                    elif geom.geom_type in ['Polygon', 'MultiPolygon']:
                        # For areas, use the centroid as the representative point
                        geom_wkt = f"SRID=4326;{geom.centroid.wkt}"
                    else:
                        # Skip other types like lines
                        continue

                    pois_to_insert.append({
                        "osm_id": feature['properties'].get('osm_id'),
                        "name": feature['properties'].get('name'),
                        "type": poi_type,
                        "geom": geom_wkt
                    })
    except Exception as e:
        print(f"🔥 Error reading shapefile: {e}")
        return

    if not pois_to_insert:
        print("⚠️ No POIs found to insert. Check your TARGET_POIS list.")
        return

    print(f"Found {len(pois_to_insert)} POIs. Clearing old data and inserting new...")
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE TABLE pois;"))
        sql = text("""
            INSERT INTO pois (osm_id, name, type, geom)
            VALUES (:osm_id, :name, :type, ST_GeogFromText(:geom))
        """)
        connection.execute(sql, pois_to_insert)

    print(f"✅ POI data imported successfully! ({len(pois_to_insert)} features loaded)")

if __name__ == "__main__":
    run_import()