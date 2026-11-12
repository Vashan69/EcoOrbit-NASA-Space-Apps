// ============================================================
// The Third World Peace — shared application logic
// Runs on all tab pages (Overview / Tracking / Assets / Alerts).
// Every DOM lookup is guarded with `if(el)` so a page missing a
// given widget simply skips that feature instead of erroring.
// ============================================================
(function(){
  function $(id){ return document.getElementById(id); }

  var SATELLITES = [
    { id:"VX-250-A4", name:"Vertex 250x", lat:34,  lon:18,  altitude:512, velocity:7.6, nextPass:"04:32", status:"on"  },
    { id:"OR-4-NB",   name:"Orbit-4",     lat:-6,  lon:-47, altitude:705, velocity:7.4, nextPass:"01:12", status:"on"  },
    { id:"HL-11",     name:"Helios-11",   lat:51,  lon:105, altitude:388, velocity:7.8, nextPass:"07:05", status:"warn"},
    { id:"MR-2",      name:"Meridian-2",  lat:-25, lon:135, altitude:610, velocity:7.5, nextPass:"02:47", status:"on"  },
    { id:"PL-9",      name:"Polaris-9",   lat:64,  lon:-21, altitude:820, velocity:7.2, nextPass:"05:58", status:"on"  }
  ];

  var ALERTS = [
    { title:"Signal degraded", detail:"Helios-11 · downlink below threshold", tone:"warn" },
    { title:"Ground station sync", detail:"Manila station reconnected", tone:"ok" },
    { title:"New pass scheduled", detail:"Meridian-2 · in 2h 47m", tone:"ok" }
  ];

  var state = { units:"km", refreshMs:5000, selected:SATELLITES[0].id, timer:null, alertFilter:"all" };

  // ---------- helpers ----------
  function km(v){ return state.units==="km" ? Math.round(v)+" km" : Math.round(v*0.621371)+" mi"; }
  function kms(v){ return state.units==="km" ? v.toFixed(1)+" km/s" : (v*0.621371).toFixed(1)+" mi/s"; }
  function byId(id){ return SATELLITES.filter(function(s){return s.id===id;})[0]; }
  window.__SATELLITES = SATELLITES;

  // ---------- satellite search / selection (sidebar, all pages) ----------
  function renderSatList(filter){
    var list = $("satList"); if(!list) return;
    var q = (filter||"").toLowerCase();
    var rows = SATELLITES.filter(function(s){ return s.name.toLowerCase().indexOf(q)>-1 || s.id.toLowerCase().indexOf(q)>-1; });
    list.innerHTML = "";
    if(!rows.length){ list.innerHTML = '<div class="sat-empty">No satellites match.</div>'; return; }
    rows.forEach(function(s){
      var row = document.createElement("div");
      row.className = "sat-row" + (s.id===state.selected ? " selected" : "");
      row.innerHTML = '<span class="stat-dot" style="background:'+(s.status==="on"?"#38e29b":"#ffb35a")+'"></span><span class="name">'+s.name+'</span>';
      row.addEventListener("click", function(){ selectSatellite(s.id); });
      list.appendChild(row);
    });
  }

  function selectSatellite(id){
    var s = byId(id);
    if(!s) return;
    state.selected = id;
    if($("satName")) $("satName").textContent = s.name;
    if($("satId")) $("satId").textContent = "ID · " + s.id;
    if($("satAltitude")) $("satAltitude").textContent = km(s.altitude);
    if($("satVelocity")) $("satVelocity").textContent = kms(s.velocity);
    if($("satNextPass")) $("satNextPass").textContent = s.nextPass;
    if($("selTagName")) $("selTagName").textContent = s.name;
    var input = $("satSearchInput");
    renderSatList(input ? input.value : "");
    renderTrackingTable();
    renderAssetsGrid();
    if(window.__globeSelect) window.__globeSelect(id);
  }
  window.selectSatellite = selectSatellite;

  if($("satellitesNavItem")){
    $("satellitesNavItem").addEventListener("click", function(){
      var panel = $("satSearch");
      panel.classList.toggle("open");
      if(panel.classList.contains("open")) renderSatList("");
    });
  }
  if($("satSearchInput")){
    $("satSearchInput").addEventListener("input", function(e){ renderSatList(e.target.value); });
  }

  // ---------- alerts dropdown (topbar, all pages) ----------
  function renderAlerts(){
    var wrap = $("alertsList"); if(!wrap) return;
    wrap.innerHTML = "";
    if(!ALERTS.length){ wrap.innerHTML = '<div class="alert-empty">You\'re all caught up.</div>'; }
    ALERTS.forEach(function(a, i){
      var el = document.createElement("div");
      el.className = "alert-item";
      el.innerHTML = '<div class="txt"><b style="color:'+(a.tone==="warn"?"#ffb35a":"#38e29b")+'">'+a.title+'</b><span>'+a.detail+'</span></div><button aria-label="Dismiss">&times;</button>';
      el.querySelector("button").addEventListener("click", function(){
        ALERTS.splice(i,1); renderAlerts(); renderAlertsFull();
      });
      wrap.appendChild(el);
    });
    if($("alertsBadge")){
      $("alertsBadge").style.display = ALERTS.length ? "inline-block" : "none";
      $("alertsBadge").textContent = ALERTS.length;
    }
  }

  function togglePanel(panelEl){
    var wasOpen = panelEl.classList.contains("open");
    document.querySelectorAll(".panel.open").forEach(function(p){ p.classList.remove("open"); });
    if(!wasOpen) panelEl.classList.add("open");
  }
  if($("alertsBtn")){
    $("alertsBtn").addEventListener("click", function(e){
      e.stopPropagation(); togglePanel($("alertsPanel"));
    });
  }
  if($("settingsBtn")){
    $("settingsBtn").addEventListener("click", function(e){
      e.stopPropagation(); togglePanel($("settingsPanel"));
    });
  }
  document.addEventListener("click", function(){
    document.querySelectorAll(".panel.open").forEach(function(p){ p.classList.remove("open"); });
  });
  document.querySelectorAll(".panel").forEach(function(p){ p.addEventListener("click", function(e){ e.stopPropagation(); }); });

  // ---------- settings: units + refresh rate (topbar, all pages) ----------
  if($("unitsSeg")){
    $("unitsSeg").addEventListener("click", function(e){
      var btn = e.target.closest("button"); if(!btn) return;
      state.units = btn.dataset.unit;
      document.querySelectorAll("#unitsSeg button").forEach(function(b){ b.classList.toggle("active", b===btn); });
      selectSatellite(state.selected);
    });
  }
  if($("refreshRate")){
    $("refreshRate").addEventListener("change", function(e){
      state.refreshMs = parseInt(e.target.value,10);
      startLiveUpdates();
    });
  }

  // ---------- theme toggle (topbar, all pages) ----------
  function applyTheme(t){
    document.documentElement.setAttribute("data-theme", t);
    try{ localStorage.setItem("twp-theme", t); }catch(err){}
  }
  var savedTheme = "dark";
  try{ savedTheme = localStorage.getItem("twp-theme") || "dark"; }catch(err){}
  applyTheme(savedTheme);
  if($("themeBtn")){
    $("themeBtn").addEventListener("click", function(){
      var cur = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(cur);
    });
  }

  // ---------- live-updating chart / stats (Overview only) ----------
  function pts(base, jitter){
    var out = [];
    for(var i=0;i<14;i++){
      var x = i*20;
      var y = Math.max(6, Math.min(84, base + (Math.random()-0.5)*jitter));
      out.push(x+","+Math.round(y));
    }
    return out.join(" ");
  }
  function liveTick(){
    if(!$("signalValue")) return;
    var sig = Math.round(78 + Math.random()*10);
    $("signalValue").textContent = sig+"%";
    if($("signalRingVal")) $("signalRingVal").textContent = sig+"%";
    if($("signalRing")) $("signalRing").style.background =
      "conic-gradient(var(--accent) 0deg "+(sig*3.6)+"deg,#1c2029 "+(sig*3.6)+"deg 360deg)";
    if($("upLine")) $("upLine").setAttribute("points", pts(40,40));
    if($("downLine")) $("downLine").setAttribute("points", pts(65,25));
  }
  function startLiveUpdates(){
    if(state.timer) clearInterval(state.timer);
    if(state.refreshMs>0) state.timer = setInterval(liveTick, state.refreshMs);
  }

  // ---------- Tracking tab: full satellite table ----------
  function renderTrackingTable(){
    var body = $("trackingTableBody"); if(!body) return;
    body.innerHTML = "";
    SATELLITES.forEach(function(s){
      var tr = document.createElement("tr");
      var selected = s.id === state.selected;
      tr.style.cursor = "pointer";
      tr.style.background = selected ? (document.documentElement.getAttribute("data-theme")==="light" ? "#eaf2ff" : "#161a24") : "";
      tr.innerHTML =
        '<td style="padding:9px 4px; border-bottom:1px solid #161a22;">'+s.name+'</td>' +
        '<td class="dim" style="padding:9px 4px; border-bottom:1px solid #161a22;">'+s.id+'</td>' +
        '<td class="dim" style="padding:9px 4px; border-bottom:1px solid #161a22;">'+s.lat.toFixed(1)+', '+s.lon.toFixed(1)+'</td>' +
        '<td style="padding:9px 4px; border-bottom:1px solid #161a22;">'+km(s.altitude)+'</td>' +
        '<td style="padding:9px 4px; border-bottom:1px solid #161a22;">'+kms(s.velocity)+'</td>' +
        '<td style="padding:9px 4px; border-bottom:1px solid #161a22;">'+s.nextPass+'</td>' +
        '<td style="padding:9px 4px; border-bottom:1px solid #161a22;"><span class="status '+(s.status==="on"?"on":"warn")+'"></span>'+(s.status==="on"?"Nominal":"Degraded")+'</td>';
      tr.addEventListener("click", function(){ selectSatellite(s.id); });
      body.appendChild(tr);
    });
  }

  // ---------- Assets tab: card grid ----------
  function renderAssetsGrid(){
    var grid = $("assetsGrid"); if(!grid) return;
    grid.innerHTML = "";
    SATELLITES.forEach(function(s){
      var card = document.createElement("div");
      card.className = "card asset-card";
      card.style.cursor = "pointer";
      card.style.outline = s.id===state.selected ? "1px solid var(--accent)" : "none";
      card.innerHTML =
        '<div class="top"><div><b>'+s.name+'</b><small>'+s.id+'</small></div>' +
        '<span class="pill '+(s.status==="on"?"on":"warn")+'">'+(s.status==="on"?"Active":"Degraded")+'</span></div>' +
        '<div class="metric"><span>Altitude</span><b>'+km(s.altitude)+'</b></div>' +
        '<div class="metric"><span>Velocity</span><b>'+kms(s.velocity)+'</b></div>' +
        '<div class="metric"><span>Next pass</span><b>'+s.nextPass+'</b></div>';
      card.addEventListener("click", function(){ selectSatellite(s.id); });
      grid.appendChild(card);
    });
  }

  // ---------- Alerts tab: full alert center with filters ----------
  function renderAlertsFull(){
    var wrap = $("alertsFullList"); if(!wrap) return;
    var rows = ALERTS.filter(function(a){ return state.alertFilter==="all" || a.tone===state.alertFilter; });
    wrap.innerHTML = "";
    if(!rows.length){ wrap.innerHTML = '<div class="alert-empty">Nothing here.</div>'; return; }
    rows.forEach(function(a){
      var i = ALERTS.indexOf(a);
      var el = document.createElement("div");
      el.className = "alerts-full-item";
      el.innerHTML = '<div class="txt"><b style="color:'+(a.tone==="warn"?"#ffb35a":"#38e29b")+'">'+a.title+'</b><span>'+a.detail+'</span></div><button aria-label="Dismiss">&times;</button>';
      el.querySelector("button").addEventListener("click", function(){
        ALERTS.splice(i,1); renderAlertsFull(); renderAlerts();
      });
      wrap.appendChild(el);
    });
  }
  if($("alertsFilterSeg")){
    $("alertsFilterSeg").addEventListener("click", function(e){
      var btn = e.target.closest("button"); if(!btn) return;
      state.alertFilter = btn.dataset.filter;
      document.querySelectorAll("#alertsFilterSeg button").forEach(function(b){ b.classList.toggle("active", b===btn); });
      renderAlertsFull();
    });
  }

  // ---------- init ----------
  renderSatList("");
  renderAlerts();
  renderAlertsFull();
  renderTrackingTable();
  renderAssetsGrid();
  startLiveUpdates();
})();
