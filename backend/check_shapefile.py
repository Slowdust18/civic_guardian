# backend/check_shapefile.py
import fiona
import os

# --- IMPORTANT: Set this path to your shapefile ---
SHAPEFILE_PATH = "C:\\Users\\slowd\\OneDrive\\Documents\\western-zone-250918-free.shp\\gis_osm_pois_a_free_1.shp" 
def find_unique_categories():
    if not os.path.exists(SHAPEFILE_PATH):
        print(f"File not found at: {SHAPEFILE_PATH}")
        return

    unique_fclasses = set()
    print("Reading shapefile to find all unique categories...")
    with fiona.open(SHAPEFILE_PATH, 'r') as source:
        for feature in source:
            fclass = feature['properties'].get('fclass')
            if fclass:
                unique_fclasses.add(fclass)

    print("\n--- Unique Categories Found in Your File ---")
    for category in sorted(list(unique_fclasses)):
        print(category)
    print("------------------------------------------")

if __name__ == "__main__":
    find_unique_categories()