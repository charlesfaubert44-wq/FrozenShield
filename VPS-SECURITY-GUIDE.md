# VPS Security Guide for Ubuntu 25.04 + Coolify

## Table of Contents
1. [Initial Server Hardening](#1-initial-server-hardening)
2. [SSH Security](#2-ssh-security)
3. [Firewall Configuration](#3-firewall-configuration)
4. [User Management](#4-user-management)
5. [System Updates & Monitoring](#5-system-updates--monitoring)
6. [Docker & Coolify Security](#6-docker--coolify-security)
7. [SSL/TLS Configuration](#7-ssltls-configuration)
8. [Backup Strategy](#8-backup-strategy)
9. [Security Monitoring](#9-security-monitoring)
10. [Quick Security Checklist](#10-quick-security-checklist)

---

## 1. Initial Server Hardening

### Update System Packages
```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Remove unnecessary packages
sudo apt autoremove -y
sudo apt autoclean
```

### Set Hostname
```bash
# Set a meaningful hostname
sudo hostnamectl set-hostname frozenshield-prod

# Edit /etc/hosts
sudo nano /etc/hosts
# Add: 127.0.0.1 frozenshield-prod
```

### Configure Timezone
```bash
# Set timezone
sudo timedatectl set-timezone America/Toronto  # Or your timezone

# Verify
timedatectl
```

---

## 2. SSH Security

### Create SSH Key (On Your Local Machine)
```bash
# On your LOCAL machine (Windows PowerShell or WSL)
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/frozenshield_vps

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/frozenshield_vps.pub ubuntu@YOUR_VPS_IP

# Test connection
ssh -i ~/.ssh/frozenshield_vps ubuntu@YOUR_VPS_IP
```

### Harden SSH Configuration
```bash
# Backup original config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

**Critical SSH Settings:**
```bash
# Disable root login
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Change default port (optional but recommended)
Port 2222  # Choose a non-standard port (1024-65535)

# Limit user access
AllowUsers ubuntu

# Disable X11 forwarding
X11Forwarding no

# Set login grace time
LoginGraceTime 30

# Maximum auth attempts
MaxAuthTries 3

# Use only strong ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
```

**Restart SSH (IMPORTANT: Keep current session open!):**
```bash
# Test configuration first
sudo sshd -t

# If test passes, restart SSH
sudo systemctl restart ssh

# KEEP YOUR CURRENT SSH SESSION OPEN
# Open a NEW terminal and test connection before closing
ssh -i ~/.ssh/frozenshield_vps -p 2222 ubuntu@YOUR_VPS_IP
```

### Install and Configure Fail2Ban
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban Configuration:**
```ini
[DEFAULT]
# Ban hosts for 1 hour
bantime = 3600
findtime = 600
maxretry = 3
destemail = your-email@example.com
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 2222  # Match your SSH port
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
```

```bash
# Start Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## 3. Firewall Configuration

### Configure UFW (Uncomplicated Firewall)
```bash
# Install UFW
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (use your custom port if changed)
sudo ufw allow 2222/tcp comment 'SSH'

# Allow HTTP and HTTPS (for Coolify/web apps)
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow Coolify management port (default 8000)
sudo ufw allow 8000/tcp comment 'Coolify Dashboard'

# Review rules before enabling
sudo ufw show added

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Additional Firewall Rules (if needed)
```bash
# Allow specific IP only for SSH (more secure)
sudo ufw delete allow 2222/tcp
sudo ufw allow from YOUR_HOME_IP to any port 2222 proto tcp comment 'SSH from home'

# Rate limiting for SSH
sudo ufw limit 2222/tcp

# Check logs
sudo tail -f /var/log/ufw.log
```

---

## 4. User Management

### Create Non-Root Sudo User (if not using ubuntu)
```bash
# Create new user
sudo adduser frozenshield

# Add to sudo group
sudo usermod -aG sudo frozenshield

# Add to docker group (for Coolify)
sudo usermod -aG docker frozenshield

# Set up SSH keys for new user
sudo mkdir -p /home/frozenshield/.ssh
sudo cp /home/ubuntu/.ssh/authorized_keys /home/frozenshield/.ssh/
sudo chown -R frozenshield:frozenshield /home/frozenshield/.ssh
sudo chmod 700 /home/frozenshield/.ssh
sudo chmod 600 /home/frozenshield/.ssh/authorized_keys
```

### Disable Root Login Completely
```bash
# Lock root account
sudo passwd -l root

# Verify
sudo passwd -S root  # Should show "L" for locked
```

### Configure Sudo Security
```bash
# Edit sudoers file safely
sudo visudo

# Add these lines:
Defaults    timestamp_timeout=5
Defaults    passwd_timeout=1
Defaults    passwd_tries=3
Defaults    logfile="/var/log/sudo.log"
Defaults    log_input,log_output
```

---

## 5. System Updates & Monitoring

### Configure Automatic Security Updates
```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades apt-listchanges -y

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades

# Edit config
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

**Recommended settings:**
```bash
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
```

### Install Essential Monitoring Tools
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs ncdu -y

# Install logwatch for daily security reports
sudo apt install logwatch -y

# Configure logwatch
sudo nano /etc/cron.daily/00logwatch
```

Add:
```bash
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto your-email@example.com --detail high
```

### Set Up Disk Space Monitoring
```bash
# Create disk monitoring script
sudo nano /usr/local/bin/check-disk-space.sh
```

Add:
```bash
#!/bin/bash
THRESHOLD=80
CURRENT=$(df / | grep / | awk '{ print $5}' | sed 's/%//g')

if [ "$CURRENT" -gt "$THRESHOLD" ]; then
    echo "Disk space critical: ${CURRENT}% used" | mail -s "Disk Space Alert" your-email@example.com
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/check-disk-space.sh

# Add to crontab
sudo crontab -e
# Add: 0 */6 * * * /usr/local/bin/check-disk-space.sh
```

---

## 6. Docker & Coolify Security

### Secure Docker Daemon
```bash
# Edit Docker daemon config
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "userland-proxy": false,
  "no-new-privileges": true,
  "live-restore": true,
  "icc": false
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

### Docker Security Best Practices
```bash
# Never run containers as root in your Dockerfiles
# Use USER directive in Dockerfile:
# USER node  # or appropriate non-root user

# Scan images for vulnerabilities
docker scout cves YOUR_IMAGE_NAME

# Remove unused images/containers regularly
docker system prune -a --volumes -f
```

### Coolify-Specific Security
```bash
# Change default Coolify admin password immediately
# Access: http://YOUR_VPS_IP:8000

# Enable 2FA in Coolify dashboard
# Settings > Security > Two-Factor Authentication

# Restrict Coolify dashboard access by IP
sudo ufw delete allow 8000/tcp
sudo ufw allow from YOUR_HOME_IP to any port 8000 proto tcp comment 'Coolify Dashboard'

# Or use Cloudflare Access/Tunnel for Coolify dashboard
```

### Environment Variables Security
```bash
# Never commit .env files
# Use Coolify's built-in environment variable encryption

# For local development, use git-crypt or similar
sudo apt install git-crypt -y

# In your repo
cd /path/to/repo
git-crypt init
echo ".env filter=git-crypt diff=git-crypt" >> .gitattributes
```

---

## 7. SSL/TLS Configuration

### Let's Encrypt with Coolify
Coolify handles SSL automatically, but verify:
- Enable "Auto SSL" in Coolify for each application
- Ensure domains point to your VPS IP
- Verify SSL renewal cron job exists

### Additional SSL Hardening
```bash
# If using nginx proxy (Coolify uses Traefik by default)
# Check Traefik SSL configuration
docker exec -it coolify-proxy cat /traefik/traefik.yaml
```

### Force HTTPS Redirects
In Coolify dashboard:
- Go to your application settings
- Enable "Force HTTPS" option

---

## 8. Backup Strategy

### Database Backups
```bash
# Create backup directory
sudo mkdir -p /backups/databases
sudo chown ubuntu:ubuntu /backups/databases

# Example PostgreSQL backup script
sudo nano /usr/local/bin/backup-db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/databases"
DB_CONTAINER="your-postgres-container"

# Backup PostgreSQL
docker exec $DB_CONTAINER pg_dumpall -U postgres | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# Optional: Upload to S3/Backblaze/etc
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-bucket/backups/
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### Application Code Backups
```bash
# Coolify stores data in /data/coolify
# Back up Coolify data
sudo nano /usr/local/bin/backup-coolify.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/coolify_$DATE.tar.gz /data/coolify
find /backups -name "coolify_*.tar.gz" -mtime +14 -delete
```

---

## 9. Security Monitoring

### Install and Configure AIDE (File Integrity Monitoring)
```bash
# Install AIDE
sudo apt install aide -y

# Initialize database
sudo aideinit

# Move database
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Run check
sudo aide --check

# Schedule daily checks
echo "0 5 * * * root /usr/bin/aide --check | mail -s 'AIDE Report' your-email@example.com" | sudo tee -a /etc/crontab
```

### Install Rootkit Hunter
```bash
# Install rkhunter
sudo apt install rkhunter -y

# Update database
sudo rkhunter --update
sudo rkhunter --propupd

# Run scan
sudo rkhunter --check --skip-keypress

# Schedule weekly scans
echo "0 3 * * 0 root /usr/bin/rkhunter --check --skip-keypress --report-warnings-only | mail -s 'rkhunter Report' your-email@example.com" | sudo tee -a /etc/crontab
```

### Install ClamAV (Antivirus)
```bash
# Install ClamAV
sudo apt install clamav clamav-daemon -y

# Update virus database
sudo systemctl stop clamav-freshclam
sudo freshclam
sudo systemctl start clamav-freshclam

# Scan system
sudo clamscan -r -i /home
```

### Set Up Log Monitoring
```bash
# Install logwatch
sudo apt install logwatch -y

# View today's logs
sudo logwatch --detail High --range today

# Configure email reports
sudo nano /etc/cron.daily/00logwatch
```

### Monitor Failed Login Attempts
```bash
# View failed login attempts
sudo grep "Failed password" /var/log/auth.log

# View successful logins
sudo grep "Accepted" /var/log/auth.log

# Monitor in real-time
sudo tail -f /var/log/auth.log
```

---

## 10. Quick Security Checklist

### Essential (Do These First)
- [ ] Update all system packages
- [ ] Set up SSH key authentication
- [ ] Disable password authentication
- [ ] Change SSH to non-standard port
- [ ] Install and configure Fail2Ban
- [ ] Set up UFW firewall
- [ ] Change default Coolify admin password
- [ ] Enable SSL/TLS for all applications
- [ ] Set up automatic security updates

### Important (Do Within First Week)
- [ ] Configure database backups
- [ ] Set up Logwatch for email alerts
- [ ] Install and configure AIDE
- [ ] Restrict Coolify dashboard access by IP
- [ ] Enable 2FA on Coolify
- [ ] Set up disk space monitoring
- [ ] Configure Docker security settings
- [ ] Review and limit sudo access

### Recommended (Ongoing)
- [ ] Run weekly security scans (rkhunter)
- [ ] Review logs weekly
- [ ] Test backups monthly
- [ ] Update SSH keys every 6 months
- [ ] Review firewall rules quarterly
- [ ] Audit user accounts quarterly
- [ ] Document all security changes
- [ ] Keep security runbook updated

---

## Emergency Response Plan

### If Server is Compromised

1. **Immediate Actions:**
```bash
# Disconnect from network (if possible via VPS control panel)
# Or block all incoming traffic
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default deny outgoing
```

2. **Investigation:**
```bash
# Check current connections
sudo netstat -tupan

# Check running processes
ps aux

# Check recent logins
last
lastlog

# Check for unauthorized users
cat /etc/passwd

# Check for suspicious cron jobs
sudo crontab -l
crontab -l
```

3. **Recovery:**
- Restore from known good backup
- Rotate all credentials (SSH keys, passwords, API keys)
- Review all application code for backdoors
- Consider full server rebuild from clean image

---

## Additional Resources

### Useful Commands for Security Audits
```bash
# Check open ports
sudo ss -tulpn

# Check firewall status
sudo ufw status verbose

# Check fail2ban status
sudo fail2ban-client status

# View system logs
sudo journalctl -xe

# Check disk usage
df -h
ncdu /

# Check memory usage
free -h

# Check running Docker containers
docker ps -a

# Check Docker resource usage
docker stats

# View recent security updates
grep -i "security" /var/log/dpkg.log
```

### Security Headers for Web Apps
Add to your application (via Coolify environment variables or nginx config):
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Monitoring Services to Consider
- **Uptime Monitoring:** UptimeRobot (free tier), Pingdom
- **Security Scanning:** Snyk, OWASP ZAP
- **Log Aggregation:** Papertrail, Logtail
- **Server Monitoring:** Netdata, Grafana + Prometheus
- **Intrusion Detection:** OSSEC, Wazuh

---

## Final Notes

**Security is a continuous process, not a one-time setup.**

- Review this guide monthly
- Stay updated on Ubuntu security advisories
- Join security mailing lists
- Test your backups regularly
- Document everything you change
- Keep a disaster recovery plan

**Priority Order:**
1. Prevent unauthorized access (SSH, Firewall)
2. Detect intrusions (Monitoring, Fail2Ban)
3. Respond to incidents (Backups, Response plan)
4. Maintain security posture (Updates, Audits)

---

**Last Updated:** 2025-12-28
**Next Review:** 2026-01-28
