# Management Suite - Dashboards + Real Database
25 standalone modules (one .html each) + master dashboard (index.html).

## Option A - Shared real database (recommended)
1. Install Node.js (nodejs.org)
2. Run start.bat (Windows) or ./start.sh (Mac/Linux)  ->  open http://localhost:3000
Data is saved in the ./data folder (one JSON file per module), shared by everyone who opens the app
and live-refreshed every few seconds. Password-protect: set ADMIN_PASSWORD=yourpass before running.

## Option B - No install
Double-click any module .html. Data is saved in your browser only.

## Your own real data
Use "Import CSV" in each module (header row = field names) or type records in. "Backup JSON" / "Restore JSON" for backups.
Every module shows KPI cards, donut/bar/column charts, upcoming dates, top values; "Print report" makes a PDF.
