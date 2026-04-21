#!/bin/bash
set -e
export SUDO_ASKPASS=$HOME/bin/askpass

REPO="/home/brodie/Desktop/Repos/greyzone"

echo "=== Deploying Greyzone ==="

# 1. Install nginx site config
echo "[1/5] Setting up nginx..."
sudo -A cp "$REPO/infra/dev/nginx-greyzone" /etc/nginx/sites-available/greyzone
sudo -A ln -sf /etc/nginx/sites-available/greyzone /etc/nginx/sites-enabled/greyzone
sudo -A nginx -t && sudo -A systemctl reload nginx

# 2. Install systemd services
echo "[2/5] Installing systemd services..."
sudo -A cp "$REPO/infra/dev/greyzone-api.service" /etc/systemd/system/
sudo -A cp "$REPO/infra/dev/greyzone-ai.service" /etc/systemd/system/
sudo -A systemctl daemon-reload

# 3. Start/restart services
echo "[3/5] Starting services..."
sudo -A systemctl enable greyzone-api greyzone-ai
# Ensure stale manual API process cannot block systemd bind on :8010
api_pid=$(ss -tlnp | sed -n 's/.*127\.0\.0\.1:8010.*pid=\([0-9]\+\).*/\1/p' | head -1)
if [ -n "$api_pid" ]; then
    service_pid=$(systemctl show -p MainPID --value greyzone-api 2>/dev/null || true)
    if [ "$api_pid" != "$service_pid" ]; then
        echo "  Found stale API PID on :8010 ($api_pid), terminating..."
        kill "$api_pid"
        sleep 1
    fi
fi
sudo -A systemctl restart greyzone-api
sudo -A systemctl restart greyzone-ai

# 4. Wait for API to be ready
echo "[4/5] Waiting for API..."
for i in {1..10}; do
    if curl -s http://localhost:8010/api/v1/health > /dev/null 2>&1; then
        echo "  API is up!"
        break
    fi
    echo "  Waiting... ($i)"
    sleep 2
done

# 5. Show status
echo "[5/5] Status:"
echo "  API:      $(systemctl is-active greyzone-api)"
echo "  AI Agent: $(systemctl is-active greyzone-ai)"
echo "  Nginx:    $(systemctl is-active nginx)"
echo ""
echo "Done! Add the tunnel route for greyzone.sandford.systems -> http://localhost:8020"
