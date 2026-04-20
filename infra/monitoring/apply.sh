#!/bin/bash
# Apply greyzone monitoring configuration.
# Run from the repo root: sudo bash infra/monitoring/apply.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROM_CONF="/etc/prometheus/prometheus.yml"
PROM_RULES_DIR="/etc/prometheus/rules"
GRAFANA_DASHBOARDS_DIR="/var/lib/grafana/dashboards"

echo "=== Greyzone monitoring setup ==="

# 1. Add greyzone scrape job to Prometheus if not already present
if grep -q "greyzone-api" "$PROM_CONF"; then
    echo "[skip] greyzone-api scrape job already in $PROM_CONF"
else
    echo "[add] Adding greyzone-api scrape job to $PROM_CONF"
    cat >> "$PROM_CONF" << 'EOF'

  - job_name: 'greyzone-api'
    scrape_interval: 15s
    scrape_timeout: 10s
    static_configs:
      - targets: ['localhost:8010']
        labels:
          app: 'greyzone'
          component: 'api'
EOF
    echo "    done."
fi

# 2. Install alert rules
echo "[copy] Installing alert rules -> $PROM_RULES_DIR/greyzone-alerts.yml"
cp "$SCRIPT_DIR/greyzone-alerts.yml" "$PROM_RULES_DIR/greyzone-alerts.yml"
chown prometheus:prometheus "$PROM_RULES_DIR/greyzone-alerts.yml" 2>/dev/null || true

# 3. Validate Prometheus config
echo "[validate] Checking prometheus config..."
promtool check config "$PROM_CONF"

# 4. Reload Prometheus (no restart needed — hot reload via SIGHUP)
echo "[reload] Reloading Prometheus..."
systemctl reload prometheus || kill -HUP "$(pgrep prometheus)" 2>/dev/null || true

# 5. Install Grafana dashboard
echo "[copy] Installing Grafana dashboard -> $GRAFANA_DASHBOARDS_DIR/greyzone.json"
cp "$SCRIPT_DIR/greyzone-dashboard.json" "$GRAFANA_DASHBOARDS_DIR/greyzone.json"
chown grafana:grafana "$GRAFANA_DASHBOARDS_DIR/greyzone.json" 2>/dev/null || true

# Grafana auto-discovers dashboards from the provisioned directory — no restart needed.
echo ""
echo "Done. Metrics will appear in Grafana within ~30s."
echo "  Dashboard: http://localhost:3000 → Greyzone — Application Metrics"
echo "  Targets:   http://localhost:9090/targets (look for greyzone-api)"
