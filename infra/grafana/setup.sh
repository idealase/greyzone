#!/usr/bin/env bash
# Setup Prometheus scraping for Greyzone API metrics
# and import the Grafana dashboard.
#
# Usage:  sudo bash infra/grafana/setup.sh
#         (or run the Prometheus part with sudo, Grafana part without)
set -euo pipefail

PROM_CONFIG="/etc/prometheus/prometheus.yml"
DASHBOARD_JSON="$(dirname "$0")/greyzone-dashboard.json"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASS="${GRAFANA_PASS:-admin}"

# --- 1. Add Prometheus scrape target ---
if grep -q 'greyzone-api' "$PROM_CONFIG" 2>/dev/null; then
  echo "✓ Prometheus scrape target already configured"
else
  echo "Adding greyzone-api scrape target to $PROM_CONFIG ..."
  cat >> "$PROM_CONFIG" <<'SCRAPE'

  - job_name: 'greyzone-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8010']
    metrics_path: /metrics
SCRAPE
  echo "✓ Scrape target added"

  # Reload Prometheus config
  if command -v systemctl &>/dev/null && systemctl is-active prometheus &>/dev/null; then
    systemctl reload prometheus
    echo "✓ Prometheus reloaded via systemd"
  elif curl -s -X POST http://localhost:9090/-/reload &>/dev/null; then
    echo "✓ Prometheus reloaded via HTTP"
  else
    echo "⚠ Could not reload Prometheus — restart it manually"
  fi
fi

# --- 2. Import Grafana dashboard ---
if [ ! -f "$DASHBOARD_JSON" ]; then
  echo "✗ Dashboard JSON not found at $DASHBOARD_JSON"
  exit 1
fi

echo "Importing Grafana dashboard ..."
PAYLOAD=$(python3 -c "
import json, sys
with open('$DASHBOARD_JSON') as f:
    db = json.load(f)

def replace_ds(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if v == '\${DS_PROMETHEUS}':
                obj[k] = 'Prometheus'
            else:
                replace_ds(v)
    elif isinstance(obj, list):
        for item in obj:
            replace_ds(item)

replace_ds(db)
db.pop('__inputs', None)
json.dump({'dashboard': db, 'overwrite': True, 'folderId': 0}, sys.stdout)
")

RESULT=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
  -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('status')=='success'" 2>/dev/null; then
  URL=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['url'])")
  echo "✓ Dashboard imported: ${GRAFANA_URL}${URL}"
else
  echo "✗ Dashboard import failed: $RESULT"
  exit 1
fi

echo ""
echo "Done. Verify at:"
echo "  Prometheus targets: http://localhost:9090/targets"
echo "  Grafana dashboard:  ${GRAFANA_URL}/d/greyzone-overview"
