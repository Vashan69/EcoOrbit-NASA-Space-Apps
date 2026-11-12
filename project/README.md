# NapMap

## Structure
```
project/
├─ api/          # FastAPI backend routes (Python)
├─ src/          # Compute and data acquisition (Python)
└─ web/          # Frontend files
   ├─ index.html      # Overview tab (dashboard + 3D globe)
   ├─ tracking.html   # Tracking tab (full satellite table)
   ├─ assets.html     # Assets tab (satellite card grid)
   ├─ alerts.html     # Alerts tab (full alert center)
   ├─ css/style.css   # Shared styling
   └─ js/
      ├─ app.js       # Shared logic: search, alerts, settings, theme, live updates
      └─ globe.js     # 3D Earth (Three.js) — only loaded on index.html
```

## Run the backend
```
pip install -r api/requirements.txt
uvicorn api.main:app --reload --port 8000
```

## Run the frontend
```
cd web
python -m http.server 5500
```
Then open http://localhost:5500 — app.js will call the API at
http://localhost:8000 automatically. If the API isn't running, the
dashboard falls back to built-in placeholder data.
