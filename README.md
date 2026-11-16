# EcoOrbit — NASA Repositories + ALL Data.nasa.gov Catalogue

This combined package addresses both parts of your request:

1. **NASA repositories:** a broad catalogue of 58 NASA science data repositories, services and discovery resources across Astrophysics, Biological & Physical Sciences, Earth Science, Heliophysics, Planetary Science, interdisciplinary services and cross-disciplinary portals.
2. **ALL Data.nasa.gov dataset records:** a downloader for NASA's complete public machine-readable catalogue at `https://data.nasa.gov/data.json`. NASA's website currently displays 36,518 records in the dataset listing (the count can change).

## Run everything (Windows / VS Code)

```powershell
py -m pip install requests earthaccess
py scripts\download_full_nasa_catalog.py
py scripts\harvest_earthdata_cmr.py
py scripts\download_power_bangladesh.py
```

The first script downloads NASA's complete Data.nasa.gov catalogue and creates:
- `output/nasa_data_catalog_full.json`
- `output/nasa_data_catalog_index.csv`
- `output/nasa_resource_links.csv`
- `output/download_report.json`

The Earthdata CMR harvester discovers collection metadata for useful keywords and saves JSON/CSV under `data/downloaded/cmr_catalogue` (or its configured output directory).

The Earthdata granule downloader retrieves actual granules for a selected collection. Example:

```powershell
py scripts\download_earthdata_granules.py --short-name COLLECTION_SHORT_NAME --start 2025-01-01 --end 2025-01-31 --count 10
```

Earthdata Login may be required: https://urs.earthdata.nasa.gov/

The NASA POWER script downloads actual daily observations for eight Bangladesh cities.

## Critical distinction — what "ALL" means here

- The Data.nasa.gov catalogue contains **metadata records and links**, not all the bytes of every science dataset.
- NASA states that most dataset pages describe data and point to the separate archive where the actual files are hosted.
- The 36,518 figure is the listing count visible on the portal at the time of checking; it is not a guaranteed fixed total or a count of downloadable files.
- NASA's wider science repositories are distributed across many archive systems. This package indexes 58 major repositories/services, while linking to live official directories that may list additional sub-repositories.
- Actual data files can be enormous, updated continuously, and may require account login, selection of dates/regions/products, or dataset-specific access rules. Therefore, this ZIP does not pretend to contain every underlying NASA science file.

## Official references
- Data.nasa.gov dataset listing: https://data.nasa.gov/dataset/
- Complete metadata catalogue: https://data.nasa.gov/data.json
- NASA explanation of the portal and linked archives: https://data.nasa.gov/about
- NASA data by subject: https://www.nasa.gov/nasa-data-by-subject/
- NASA Science Data Portal: https://science.data.nasa.gov/
- NASA Planetary Data repository directory: https://planetary.data.nasa.gov/find-data
- NASA Earthdata Search: https://search.earthdata.nasa.gov/
- NASA CMR: https://cmr.earthdata.nasa.gov/
- NASA Earthdata Login: https://urs.earthdata.nasa.gov/
