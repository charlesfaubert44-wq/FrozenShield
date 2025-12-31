# VPS Monitoring & Security Tools for Beginners

This guide covers beginner-friendly tools to manage and monitor your Ubuntu VPS.

## Table of Contents
1. [Cockpit - Web-Based System Manager](#1-cockpit---web-based-system-manager)
2. [Netdata - Real-Time Monitoring](#2-netdata---real-time-monitoring)
3. [Uptime Kuma - Service Monitoring](#3-uptime-kuma---service-monitoring)
4. [Terminal-Based Tools](#4-terminal-based-tools)
5. [Docker Monitoring](#5-docker-monitoring)
6. [Security Scanning Tools](#6-security-scanning-tools)
7. [Quick Setup Script](#7-quick-setup-script)

---

## 1. Cockpit - Web-Based System Manager

**Best for:** Overall system management, beginner-friendly GUI
**Access:** Web browser on port 9090
**Features:**
- System resource monitoring (CPU, RAM, Disk)
- Service management (start/stop/restart)
- Firewall management (UFW)
- Terminal access
- User management
- Updates management
- Storage management
- Network monitoring

### Installation

```bash
# Install Cockpit
sudo apt install cockpit -y

# Enable and start
sudo systemctl enable --now cockpit.socket

# Install additional modules
sudo apt install cockpit-pcp cockpit-networkmanager cockpit-storaged cockpit-packagekit -y

# Allow through firewall
sudo ufw allow 9090/tcp comment 'Cockpit Web Console'

# Check status
sudo systemctl status cockpit
```

### Access Cockpit

1. Open browser: `https://YOUR_VPS_IP:9090`
2. Login with your Ubuntu user credentials
3. Accept the self-signed certificate warning (or configure Let's Encrypt)

### Recommended Cockpit Modules

```bash
# Docker management (if using Docker)
sudo apt install cockpit-docker -y

# Podman support (alternative to Docker)
sudo apt install cockpit-podman -y

# File sharing
sudo apt install cockpit-filesharing -y

# Sosreport (system diagnostics)
sudo apt install cockpit-sosreport -y
```

### Secure Cockpit Access

```bash
# Restrict to specific IP (your home/office)
sudo ufw delete allow 9090/tcp
sudo ufw allow from YOUR_HOME_IP to any port 9090 proto tcp comment 'Cockpit'

# Or use SSH tunnel (most secure)
# On your local machine:
ssh -L 9090:localhost:9090 ubuntu@YOUR_VPS_IP -p 2222
# Then access: http://localhost:9090
```

### Cockpit Features Overview

**Dashboard:**
- CPU usage graph
- Memory usage graph
- Network traffic
- Disk I/O
- System info

**Services Tab:**
- View all systemd services
- Start/stop/restart services
- Enable/disable auto-start
- View service logs

**Logs Tab:**
- Real-time system logs
- Filter by service, priority, time
- Search logs

**Networking Tab:**
- View network interfaces
- Configure firewall rules
- Monitor active connections

**Accounts Tab:**
- Manage users
- Set passwords
- Configure SSH keys
- Set user permissions

**Updates Tab:**
- View available updates
- Apply security updates
- Schedule automatic updates

---

## 2. Netdata - Real-Time Monitoring

**Best for:** Real-time performance monitoring, anomaly detection
**Access:** Web browser on port 19999
**Features:**
- Real-time metrics (1-second granularity)
- 2000+ metrics collected automatically
- Beautiful dashboards
- Alerts and notifications
- Zero configuration needed
- Low resource usage

### Installation

```bash
# Quick install (official script)
wget -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh && sh /tmp/netdata-kickstart.sh --stable-channel --disable-telemetry

# Allow through firewall
sudo ufw allow 19999/tcp comment 'Netdata'

# Check status
sudo systemctl status netdata
```

### Access Netdata

Browser: `http://YOUR_VPS_IP:19999`

### Secure Netdata Access

**Option 1: Restrict by IP**
```bash
sudo ufw delete allow 19999/tcp
sudo ufw allow from YOUR_HOME_IP to any port 19999 proto tcp comment 'Netdata'
```

**Option 2: Configure Authentication**
```bash
# Edit config
sudo nano /etc/netdata/netdata.conf
```

Add:
```ini
[web]
    bind to = localhost
```

```bash
# Restart Netdata
sudo systemctl restart netdata

# Access via SSH tunnel
ssh -L 19999:localhost:19999 ubuntu@YOUR_VPS_IP -p 2222
# Then: http://localhost:19999
```

**Option 3: Use Nginx Reverse Proxy with Auth**
```bash
# Install nginx and apache2-utils
sudo apt install nginx apache2-utils -y

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Create nginx config
sudo nano /etc/nginx/sites-available/netdata
```

Add:
```nginx
upstream netdata {
    server 127.0.0.1:19999;
    keepalive 64;
}

server {
    listen 80;
    server_name monitor.frozenshield.ca;  # Your domain

    auth_basic "Netdata Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://netdata;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/netdata /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configure firewall
sudo ufw delete allow 19999/tcp  # Remove direct access
# HTTP/HTTPS already allowed from firewall setup
```

### Netdata Cloud (Optional)

For remote monitoring from anywhere:

```bash
# Sign up at: https://app.netdata.cloud
# Get claiming token from dashboard

# Claim your node
sudo netdata-claim.sh -token=YOUR_TOKEN -rooms=YOUR_ROOM_ID -url=https://app.netdata.cloud
```

Benefits:
- Access from anywhere
- Multiple servers in one dashboard
- Mobile app available
- No need to expose ports
- Free for personal use

### Key Netdata Metrics

**System Overview:**
- CPU utilization per core
- RAM usage (used, cached, available)
- Swap usage
- Disk I/O
- Network traffic

**Docker Monitoring:**
- Container CPU usage
- Container memory usage
- Container network traffic
- Container disk I/O

**Web Server Metrics:**
- Nginx/Apache requests
- Response times
- Status codes

**Alerts:**
- CPU over 80%
- RAM over 90%
- Disk space over 90%
- Network errors
- Service failures

---

## 3. Uptime Kuma - Service Monitoring

**Best for:** Monitoring website/service uptime
**Access:** Web interface (deploy via Coolify)
**Features:**
- Uptime monitoring
- SSL certificate monitoring
- Response time tracking
- Status pages
- Notifications (email, Slack, Discord, etc.)

### Installation via Coolify

1. **Go to Coolify Dashboard** → New Resource → Docker Compose

2. **Use this docker-compose.yml:**
```yaml
version: '3'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - uptime-kuma-data:/app/data
    ports:
      - "3001:3001"
    restart: unless-stopped

volumes:
  uptime-kuma-data:
```

3. **Configure Domain:** `monitor.frozenshield.ca`

4. **Enable SSL** in Coolify settings

5. **Access:** `https://monitor.frozenshield.ca`

### Uptime Kuma Setup

1. **First visit:** Create admin account
2. **Add monitors:**
   - HTTP(s) - Website monitoring
   - Port - Service port checks
   - Ping - Server availability
   - DNS - DNS resolution checks
   - Docker Container - Container health

3. **Configure notifications:**
   - Settings → Notifications
   - Add email, Slack, Discord, Telegram, etc.

### Example Monitors to Set Up

```
Monitor 1: Main Website
- Type: HTTP(s)
- URL: https://frozenshield.ca
- Heartbeat Interval: 60 seconds
- Notification: Email

Monitor 2: Coolify Dashboard
- Type: HTTP(s)
- URL: https://YOUR_VPS_IP:8000
- Heartbeat Interval: 300 seconds

Monitor 3: SSH Service
- Type: Port
- Hostname: YOUR_VPS_IP
- Port: 2222
- Heartbeat Interval: 300 seconds

Monitor 4: Database Container
- Type: Docker Container
- Container Name: your-postgres-container
- Docker Host: unix:///var/run/docker.sock
```

### Public Status Page

1. Go to Status Pages
2. Create New Status Page
3. Select monitors to display
4. Customize theme
5. Share public URL: `https://status.frozenshield.ca`

---

## 4. Terminal-Based Tools

For quick checks via SSH.

### btop++ - Modern Resource Monitor

```bash
# Install
sudo apt install btop -y

# Run
btop

# Keyboard shortcuts:
# q - quit
# m - menu
# + - increase update speed
# - - decrease update speed
```

**Features:**
- Beautiful UI
- CPU, memory, disk, network
- Process tree
- GPU monitoring (if applicable)
- Mouse support

### htop - Classic Process Manager

```bash
# Install
sudo apt install htop -y

# Run
htop

# Shortcuts:
# F1 - help
# F3 - search process
# F4 - filter
# F5 - tree view
# F9 - kill process
# F10 - quit
```

### Glances - Comprehensive Monitor

```bash
# Install
sudo apt install glances -y

# Run
glances

# With web server (access via browser)
glances -w

# Access: http://YOUR_VPS_IP:61208
```

**Glances Features:**
- All system stats in one view
- Docker monitoring
- Alert system
- Export to various formats
- Web interface
- API access

### ncdu - Disk Usage Analyzer

```bash
# Install
sudo apt install ncdu -y

# Scan entire system
sudo ncdu /

# Scan specific directory
ncdu /var/log

# Shortcuts:
# d - delete file/folder
# n - sort by name
# s - sort by size
# g - show graph
```

### iftop - Network Monitor

```bash
# Install
sudo apt install iftop -y

# Run (requires root)
sudo iftop

# Monitor specific interface
sudo iftop -i eth0
```

---

## 5. Docker Monitoring

Since you're using Coolify (which uses Docker), these tools are essential.

### ctop - Container Monitor

```bash
# Install
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# Run
ctop

# Shortcuts:
# a - show all containers (including stopped)
# h - help
# s - sort
# f - filter
# Enter - container details
```

**Features:**
- Real-time container metrics
- CPU, memory, network per container
- Container logs
- Start/stop containers
- Beautiful TUI

### lazydocker - Docker Terminal UI

```bash
# Install (requires Go)
sudo apt install golang-go -y
go install github.com/jesseduffield/lazydocker@latest

# Add to PATH
echo 'export PATH=$PATH:~/go/bin' >> ~/.bashrc
source ~/.bashrc

# Run
lazydocker
```

**Features:**
- Manage containers, images, volumes
- View logs
- Execute commands
- Resource stats
- Prune unused resources

### Dozzle - Docker Log Viewer

Deploy via Coolify:

**docker-compose.yml:**
```yaml
version: '3'

services:
  dozzle:
    image: amir20/dozzle:latest
    container_name: dozzle
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "8888:8080"
    restart: unless-stopped
```

Access: `http://YOUR_VPS_IP:8888`

**Features:**
- Real-time log viewing
- Multi-container logs
- Log search
- Dark/light theme
- No authentication (use firewall or reverse proxy)

### Portainer - Docker GUI

```bash
# Create volume
docker volume create portainer_data

# Run Portainer
docker run -d -p 9443:9443 -p 8000:8000 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest

# Allow through firewall
sudo ufw allow 9443/tcp comment 'Portainer'
```

Access: `https://YOUR_VPS_IP:9443`

**Features:**
- Complete Docker management
- Container management
- Image management
- Volume management
- Network management
- Compose stacks
- User access control

**Note:** Coolify already provides container management, so Portainer is optional.

---

## 6. Security Scanning Tools

### Lynis - Security Auditing

```bash
# Install
sudo apt install lynis -y

# Run system audit
sudo lynis audit system

# View report
cat /var/log/lynis-report.dat

# Check hardening index
sudo lynis show hardening-index
```

**What it checks:**
- System info
- Boot and services
- Kernel configuration
- Memory and processes
- Users and authentication
- File systems
- USB devices
- Storage
- Networking
- Firewalls
- Software packages

**Output:**
- Warnings (issues to fix)
- Suggestions (improvements)
- Hardening index (security score)

### ClamAV - Antivirus

```bash
# Install
sudo apt install clamav clamav-daemon -y

# Update virus database
sudo systemctl stop clamav-freshclam
sudo freshclam
sudo systemctl start clamav-freshclam

# Scan home directory
clamscan -r -i ~

# Scan entire system (takes time)
sudo clamscan -r -i /

# Schedule daily scans
echo "0 2 * * * root clamscan -r -i / | mail -s 'ClamAV Scan Report' your-email@example.com" | sudo tee -a /etc/crontab
```

### RKHunter - Rootkit Detection

```bash
# Install
sudo apt install rkhunter -y

# Update database
sudo rkhunter --update
sudo rkhunter --propupd

# Run scan
sudo rkhunter --check

# Skip keypress prompts
sudo rkhunter --check --skip-keypress --report-warnings-only
```

### Trivy - Container Vulnerability Scanner

```bash
# Install
sudo apt install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install trivy -y

# Scan Docker image
trivy image louislam/uptime-kuma:1

# Scan running container
trivy image $(docker inspect --format='{{.Image}}' container_name)

# Scan Dockerfile
trivy config Dockerfile
```

### Nmap - Network Scanner

```bash
# Install
sudo apt install nmap -y

# Scan your own VPS (from VPS itself)
sudo nmap -sV localhost

# Common port scan
sudo nmap -F YOUR_VPS_IP

# Comprehensive scan
sudo nmap -A YOUR_VPS_IP

# Check open ports
sudo nmap -sT YOUR_VPS_IP
```

**⚠️ Warning:** Only scan your own servers. Scanning others without permission is illegal.

---

## 7. Quick Setup Script

Save as `install-monitoring.sh`:

```bash
#!/bin/bash

echo "==================================="
echo "VPS Monitoring Tools Installation"
echo "==================================="

# Update system
echo "[1/7] Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Cockpit
echo "[2/7] Installing Cockpit..."
sudo apt install cockpit cockpit-pcp cockpit-networkmanager cockpit-packagekit -y
sudo systemctl enable --now cockpit.socket
sudo ufw allow 9090/tcp comment 'Cockpit'

# Install Netdata
echo "[3/7] Installing Netdata..."
wget -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh
sh /tmp/netdata-kickstart.sh --stable-channel --disable-telemetry --non-interactive
sudo ufw allow 19999/tcp comment 'Netdata'

# Install terminal tools
echo "[4/7] Installing terminal monitoring tools..."
sudo apt install btop htop glances ncdu iftop -y

# Install Docker monitoring
echo "[5/7] Installing ctop..."
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# Install security tools
echo "[6/7] Installing security scanning tools..."
sudo apt install lynis rkhunter clamav clamav-daemon nmap -y

# Update security databases
echo "[7/7] Updating security databases..."
sudo freshclam
sudo rkhunter --update
sudo rkhunter --propupd

echo ""
echo "==================================="
echo "Installation Complete!"
echo "==================================="
echo ""
echo "Access points:"
echo "- Cockpit: https://YOUR_VPS_IP:9090"
echo "- Netdata: http://YOUR_VPS_IP:19999"
echo ""
echo "Terminal commands:"
echo "- btop      # Modern resource monitor"
echo "- htop      # Classic process manager"
echo "- glances   # Comprehensive monitor"
echo "- ctop      # Docker container monitor"
echo "- ncdu /    # Disk usage analyzer"
echo ""
echo "Security scans:"
echo "- sudo lynis audit system"
echo "- sudo rkhunter --check"
echo "- sudo clamscan -r -i /"
echo ""
echo "Next steps:"
echo "1. Change Cockpit port or restrict by IP"
echo "2. Secure Netdata with authentication"
echo "3. Deploy Uptime Kuma via Coolify"
echo "4. Run your first security scan"
echo ""
```

Make executable and run:
```bash
chmod +x install-monitoring.sh
./install-monitoring.sh
```

---

## Recommended Setup for Beginners

### Essential (Start Here)

1. **Cockpit** - Your main control panel
   - Manage everything via web browser
   - Most beginner-friendly

2. **Netdata** - Real-time monitoring
   - See what's happening right now
   - Beautiful graphs

3. **Uptime Kuma** - Service monitoring
   - Know when something goes down
   - Email alerts

### Nice to Have

4. **btop** - Quick terminal checks
   - When SSH'd in, run `btop` to see status

5. **Lynis** - Security audits
   - Run weekly: `sudo lynis audit system`

### Advanced (Later)

6. **Portainer** - If you want more Docker control
7. **Grafana + Prometheus** - For custom dashboards
8. **ELK Stack** - For log aggregation (heavy resource usage)

---

## Daily Monitoring Routine

### Morning Check (5 minutes)

```bash
# SSH into VPS
ssh -i ~/.ssh/frozenshield_vps -p 2222 ubuntu@YOUR_VPS_IP

# Quick health check
btop  # Check resources (q to quit)

# Check failed logins
sudo fail2ban-client status sshd

# Check disk space
df -h

# Check Docker containers
docker ps

# Check for updates
sudo apt update
sudo apt list --upgradable

# Exit
exit
```

### Weekly Check (15 minutes)

1. **Open Cockpit:** Review graphs, check for alerts
2. **Open Netdata:** Look for anomalies
3. **Check Uptime Kuma:** Review downtime incidents
4. **Run security scan:**
   ```bash
   sudo lynis audit system
   ```
5. **Check logs:**
   ```bash
   sudo logwatch --detail High --range today
   ```

### Monthly Check (30 minutes)

1. **Review all alerts and logs**
2. **Test backups** - Actually restore something
3. **Update all Docker images** via Coolify
4. **Run comprehensive security scan:**
   ```bash
   sudo rkhunter --check
   sudo clamscan -r -i /home
   ```
5. **Review firewall rules:**
   ```bash
   sudo ufw status verbose
   ```
6. **Check for OS updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Resource Usage Comparison

| Tool | RAM Usage | CPU Usage | Disk Space | Complexity |
|------|-----------|-----------|------------|------------|
| Cockpit | ~50MB | Low | ~100MB | ★☆☆☆☆ Easy |
| Netdata | ~100MB | Low | ~1GB | ★☆☆☆☆ Easy |
| Uptime Kuma | ~50MB | Very Low | ~200MB | ★☆☆☆☆ Easy |
| btop | ~20MB | Very Low | ~1MB | ★☆☆☆☆ Easy |
| Portainer | ~100MB | Low | ~500MB | ★★☆☆☆ Medium |
| Grafana | ~200MB | Medium | ~1GB | ★★★★☆ Hard |

---

## Troubleshooting

### Can't Access Web Interfaces

```bash
# Check if service is running
sudo systemctl status cockpit
sudo systemctl status netdata

# Check if port is open
sudo ufw status | grep 9090
sudo ufw status | grep 19999

# Check if listening on port
sudo ss -tulpn | grep 9090
sudo ss -tulpn | grep 19999

# Check from local machine
curl -I http://YOUR_VPS_IP:19999
```

### High Resource Usage

```bash
# Find resource hogs
btop

# Stop unnecessary services
sudo systemctl stop SERVICE_NAME
sudo systemctl disable SERVICE_NAME

# Adjust Netdata memory limit
sudo nano /etc/netdata/netdata.conf
# [global]
#   memory mode = dbengine
#   page cache size = 32
```

### Slow Dashboard Loading

```bash
# Clear Netdata database (will lose historical data)
sudo systemctl stop netdata
sudo rm -rf /var/cache/netdata/*
sudo systemctl start netdata
```

---

## Security Best Practices for Monitoring Tools

### General Rules

1. **Never expose monitoring ports to public:**
   - Use firewall IP restrictions
   - Use SSH tunnels
   - Use reverse proxy with authentication

2. **Use strong passwords:**
   ```bash
   # Generate strong password
   openssl rand -base64 32
   ```

3. **Enable 2FA where available**

4. **Regular updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Monitor the monitors:**
   - Set up Uptime Kuma to monitor Cockpit/Netdata
   - Get alerts if monitoring tools go down

### SSH Tunnel Template

```bash
# In your local ~/.ssh/config
Host frozenshield-vps
    HostName YOUR_VPS_IP
    Port 2222
    User ubuntu
    IdentityFile ~/.ssh/frozenshield_vps
    LocalForward 9090 localhost:9090  # Cockpit
    LocalForward 19999 localhost:19999  # Netdata
    LocalForward 3001 localhost:3001  # Uptime Kuma
```

Then:
```bash
# Connect with tunnels
ssh frozenshield-vps

# Access locally:
# http://localhost:9090  - Cockpit
# http://localhost:19999 - Netdata
# http://localhost:3001  - Uptime Kuma
```

---

## Next Steps

1. **Install basic monitoring** using the quick setup script
2. **Secure access** to all web interfaces
3. **Set up alerts** in Uptime Kuma
4. **Create monitoring routine** (daily/weekly/monthly)
5. **Document your setup** - what runs where, what ports, etc.
6. **Test disaster recovery** - can you restore from backups?

---

**Created:** 2025-12-28
**For:** Ubuntu 25.04 VPS with Coolify
**Skill Level:** Beginner to Intermediate
