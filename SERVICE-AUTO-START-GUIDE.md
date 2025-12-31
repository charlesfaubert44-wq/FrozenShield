# VPS Service Auto-Start Guide

Quick reference for which monitoring tools start automatically on boot and how to manage them.

## Auto-Start Status by Tool

| Tool | Auto-Starts? | How to Enable | Service Name |
|------|--------------|---------------|--------------|
| **Cockpit** | ✅ Yes (if installed correctly) | `sudo systemctl enable cockpit.socket` | cockpit.socket |
| **Netdata** | ✅ Yes (default) | `sudo systemctl enable netdata` | netdata |
| **Uptime Kuma** | ✅ Yes (via Docker restart policy) | Set in docker-compose.yml | N/A (Docker) |
| **Fail2Ban** | ✅ Yes (default) | `sudo systemctl enable fail2ban` | fail2ban |
| **UFW Firewall** | ✅ Yes (when enabled) | `sudo ufw enable` | ufw |
| **Docker** | ✅ Yes (default) | `sudo systemctl enable docker` | docker |
| **SSH** | ✅ Yes (always) | `sudo systemctl enable ssh` | ssh/sshd |
| **Portainer** | ✅ Yes (if using `--restart=always`) | Set in docker run command | N/A (Docker) |
| **btop/htop** | ❌ No (terminal tools only) | N/A | N/A |
| **ctop** | ❌ No (terminal tool only) | N/A | N/A |

---

## Check If Services Are Enabled

Run this command to check all monitoring services at once:

```bash
# Check all services
systemctl is-enabled cockpit.socket
systemctl is-enabled netdata
systemctl is-enabled fail2ban
systemctl is-enabled docker
systemctl is-enabled ufw
systemctl is-enabled ssh

# Alternative: Check status (shows if enabled and running)
systemctl status cockpit.socket
systemctl status netdata
systemctl status fail2ban
systemctl status docker
```

**Expected output:** Should say `enabled` for each service.

---

## Enable Services to Auto-Start

If any service is **not** enabled, run:

```bash
# Enable Cockpit
sudo systemctl enable cockpit.socket

# Enable Netdata
sudo systemctl enable netdata

# Enable Fail2Ban
sudo systemctl enable fail2ban

# Enable Docker
sudo systemctl enable docker

# Enable UFW (firewall)
sudo systemctl enable ufw

# Enable SSH (should already be enabled)
sudo systemctl enable ssh
```

**What "enable" means:**
- Service will start automatically when system boots
- Does NOT start it right now (use `start` for that)

---

## Start Services Immediately (Without Reboot)

If service is not running right now:

```bash
# Start Cockpit
sudo systemctl start cockpit.socket

# Start Netdata
sudo systemctl start netdata

# Start Fail2Ban
sudo systemctl start fail2ban

# Start Docker
sudo systemctl start docker
```

---

## Enable AND Start in One Command

```bash
# Enable and start immediately
sudo systemctl enable --now cockpit.socket
sudo systemctl enable --now netdata
sudo systemctl enable --now fail2ban
sudo systemctl enable --now docker
```

**The `--now` flag:** Enables auto-start AND starts the service immediately.

---

## Check What Services Are Running

### Quick Check

```bash
# Check specific service
systemctl status cockpit.socket
systemctl status netdata
systemctl status fail2ban

# Check if service is active
systemctl is-active cockpit.socket
systemctl is-active netdata
```

### See All Running Services

```bash
# List all running services
systemctl list-units --type=service --state=running

# List all enabled services (auto-start on boot)
systemctl list-unit-files --type=service --state=enabled

# Show services that failed to start
systemctl --failed
```

---

## Docker Containers Auto-Start

Docker containers need the `restart` policy set.

### Check Restart Policy

```bash
# List all containers with restart policy
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.RestartPolicy}}"

# Inspect specific container
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' container_name
```

**Restart policies:**
- `no` - Never restart (❌ won't auto-start)
- `always` - Always restart (✅ auto-starts)
- `unless-stopped` - Restart unless manually stopped (✅ auto-starts)
- `on-failure` - Restart only if exits with error (⚠️ conditional)

### Set Container to Auto-Start

**For Uptime Kuma (via docker-compose):**

In your `docker-compose.yml`:
```yaml
version: '3'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped  # ← This ensures auto-start
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data

volumes:
  uptime-kuma-data:
```

Then redeploy:
```bash
docker-compose up -d
```

**For Portainer (via docker run):**
```bash
docker run -d \
  --name portainer \
  --restart=always \  # ← This ensures auto-start
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

**Update existing container:**
```bash
# Update restart policy without recreating container
docker update --restart=unless-stopped container_name

# Example
docker update --restart=unless-stopped uptime-kuma
docker update --restart=unless-stopped portainer
```

---

## Verify Auto-Start After Reboot

### Before Rebooting

```bash
# Create test script to verify after reboot
cat > ~/check-services.sh << 'EOF'
#!/bin/bash
echo "=== Service Status After Reboot ==="
echo ""
echo "Cockpit:"
systemctl is-active cockpit.socket
echo ""
echo "Netdata:"
systemctl is-active netdata
echo ""
echo "Fail2Ban:"
systemctl is-active fail2ban
echo ""
echo "Docker:"
systemctl is-active docker
echo ""
echo "Firewall:"
sudo ufw status | head -n 1
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "=== All services should show 'active' ==="
EOF

chmod +x ~/check-services.sh
```

### Reboot and Test

```bash
# Reboot the VPS
sudo reboot

# Wait 2-3 minutes, then SSH back in
ssh -i ~/.ssh/frozenshield_vps -p 2222 ubuntu@YOUR_VPS_IP

# Run check script
~/check-services.sh
```

**Expected output:** All services should show `active`.

---

## Complete Auto-Start Setup Script

Run this to ensure everything auto-starts:

```bash
#!/bin/bash

echo "Configuring all services to auto-start on boot..."
echo ""

# Enable system services
echo "[1/6] Enabling Cockpit..."
sudo systemctl enable --now cockpit.socket

echo "[2/6] Enabling Netdata..."
sudo systemctl enable --now netdata

echo "[3/6] Enabling Fail2Ban..."
sudo systemctl enable --now fail2ban

echo "[4/6] Enabling Docker..."
sudo systemctl enable --now docker

echo "[5/6] Enabling UFW Firewall..."
sudo systemctl enable ufw

echo "[6/6] Configuring Docker containers..."
# Update all running containers to auto-restart
for container in $(docker ps -q); do
    name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
    echo "  - Setting $name to auto-restart"
    docker update --restart=unless-stopped $container
done

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "Verifying services..."
echo ""

# Check status
echo "Cockpit: $(systemctl is-enabled cockpit.socket) / $(systemctl is-active cockpit.socket)"
echo "Netdata: $(systemctl is-enabled netdata) / $(systemctl is-active netdata)"
echo "Fail2Ban: $(systemctl is-enabled fail2ban) / $(systemctl is-active fail2ban)"
echo "Docker: $(systemctl is-enabled docker) / $(systemctl is-active docker)"
echo "UFW: $(systemctl is-enabled ufw) / $(sudo ufw status | head -n 1 | awk '{print $2}')"

echo ""
echo "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}\t{{.RestartPolicy}}"

echo ""
echo "All services are configured to start on boot!"
echo "Test by rebooting: sudo reboot"
```

Save as `setup-autostart.sh`, make executable, and run:

```bash
chmod +x setup-autostart.sh
./setup-autostart.sh
```

---

## Disable Auto-Start (If Needed)

If you want to stop a service from auto-starting:

```bash
# Disable service
sudo systemctl disable cockpit.socket
sudo systemctl disable netdata

# Stop service immediately
sudo systemctl stop cockpit.socket
sudo systemctl stop netdata

# Disable AND stop in one command
sudo systemctl disable --now netdata
```

For Docker containers:
```bash
# Set to never restart
docker update --restart=no container_name

# Stop container
docker stop container_name
```

---

## Troubleshooting Auto-Start Issues

### Service Won't Start on Boot

1. **Check if enabled:**
   ```bash
   systemctl is-enabled service_name
   ```

2. **Check for errors:**
   ```bash
   systemctl status service_name
   journalctl -u service_name -n 50
   ```

3. **Check dependencies:**
   ```bash
   systemctl list-dependencies service_name
   ```

4. **Try manual start:**
   ```bash
   sudo systemctl start service_name
   # If this fails, check logs
   ```

### Docker Container Won't Start

1. **Check logs:**
   ```bash
   docker logs container_name
   ```

2. **Check restart policy:**
   ```bash
   docker inspect -f '{{.HostConfig.RestartPolicy}}' container_name
   ```

3. **Check if Docker daemon is running:**
   ```bash
   systemctl status docker
   ```

4. **Try manual start:**
   ```bash
   docker start container_name
   ```

### Coolify Containers

Coolify manages its own containers. They should auto-start if:
- Coolify itself is running
- Application is not manually stopped in Coolify dashboard

Check Coolify status:
```bash
# Check Coolify containers
docker ps | grep coolify

# Restart Coolify (if needed)
docker restart coolify
```

---

## Boot Order

Services start in this order:

1. **Network** - Network interfaces come up
2. **Docker** - Docker daemon starts
3. **System Services** - SSH, UFW, Fail2Ban, etc.
4. **Docker Containers** - Containers with restart policy
5. **Web Services** - Cockpit, Netdata, etc.

**Typical boot time:** 30-90 seconds for all services to be fully ready.

---

## Monitoring Auto-Start

### Get Email When Service Fails

Create a systemd service monitor:

```bash
# Install mailutils (for sending email)
sudo apt install mailutils -y

# Create monitoring script
sudo nano /usr/local/bin/service-monitor.sh
```

Add:
```bash
#!/bin/bash

SERVICE=$1
STATUS=$(systemctl is-active $SERVICE)

if [ "$STATUS" != "active" ]; then
    echo "Service $SERVICE is $STATUS" | mail -s "Service Alert: $SERVICE Down" your-email@example.com
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/service-monitor.sh

# Add to crontab (check every 5 minutes)
sudo crontab -e
# Add these lines:
*/5 * * * * /usr/local/bin/service-monitor.sh netdata
*/5 * * * * /usr/local/bin/service-monitor.sh cockpit.socket
*/5 * * * * /usr/local/bin/service-monitor.sh fail2ban
```

### Use Uptime Kuma to Monitor Local Services

1. In Uptime Kuma dashboard
2. Add Monitor → Type: **Port**
3. Monitor local services:
   - Cockpit: localhost:9090
   - Netdata: localhost:19999
   - Docker: localhost:2375 (if enabled)

---

## Quick Reference Commands

```bash
# Check if service auto-starts on boot
systemctl is-enabled SERVICE_NAME

# Check if service is running now
systemctl is-active SERVICE_NAME

# Enable auto-start
sudo systemctl enable SERVICE_NAME

# Disable auto-start
sudo systemctl disable SERVICE_NAME

# Start service now
sudo systemctl start SERVICE_NAME

# Stop service now
sudo systemctl stop SERVICE_NAME

# Restart service
sudo systemctl restart SERVICE_NAME

# Enable AND start now
sudo systemctl enable --now SERVICE_NAME

# View service logs
journalctl -u SERVICE_NAME -f

# Check Docker container restart policy
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' CONTAINER_NAME

# Update Docker container restart policy
docker update --restart=unless-stopped CONTAINER_NAME

# See all enabled services
systemctl list-unit-files --type=service --state=enabled

# See all running services
systemctl list-units --type=service --state=running
```

---

## Summary

**After installing monitoring tools, run:**

```bash
# Ensure everything auto-starts
sudo systemctl enable --now cockpit.socket
sudo systemctl enable --now netdata
sudo systemctl enable --now fail2ban
sudo systemctl enable --now docker

# Update Docker containers
docker update --restart=unless-stopped $(docker ps -q)

# Verify
systemctl is-enabled cockpit.socket netdata fail2ban docker

# Test reboot (optional)
sudo reboot
```

**Result:** All your monitoring tools will automatically start when the VPS boots up!

---

**Created:** 2025-12-28
**Last Updated:** 2025-12-28
