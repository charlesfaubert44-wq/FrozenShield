# New Dedicated Server Setup Guide

Complete step-by-step guide to secure and configure your new dedicated server from scratch.

## Quick Start - What You'll Do

1. **Initial Connection** (5 min)
2. **Run Security Setup Script** (10 min)
3. **Install Monitoring Tools** (10 min)
4. **Install Coolify** (5 min)
5. **Final Verification** (5 min)

**Total Time:** ~35 minutes (mostly automated)

---

## Prerequisites

**On Your Local Machine (Windows):**
- SSH client (built into Windows 10/11)
- PowerShell or WSL
- Your server IP address
- Root or sudo user credentials

**Server Details You'll Need:**
- IP Address: `_______________`
- Initial Username: `_______________` (usually `root` or `ubuntu`)
- Initial Password: `_______________`

---

## Step-by-Step Setup Process

### Step 1: Initial Connection (First Login)

**From your local Windows machine (PowerShell):**

```powershell
# Connect to server for the first time
ssh root@YOUR_SERVER_IP

# Or if you have a non-root user:
ssh ubuntu@YOUR_SERVER_IP
```

**If prompted about host authenticity:**
- Type `yes` and press Enter

---

### Step 2: Update System & Create Setup Scripts

Once logged in to the server:

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl wget git ufw fail2ban -y

# Create setup directory
mkdir -p ~/server-setup
cd ~/server-setup
```

---

### Step 3: Download or Create Setup Scripts

**Option A: Download from your repo (if you've committed these scripts)**
```bash
# Clone your repo
git clone https://github.com/charlesfaubert44-wq/FrozenShield.git
cd FrozenShield
```

**Option B: Create scripts manually (use the scripts provided below)**

I'll create automated scripts for you in the next files. For now, continue:

```bash
# Create main setup script
nano ~/server-setup/setup-security.sh
```

Copy the content from `setup-security.sh` (I'll create this next)

---

### Step 4: Run Automated Security Setup

```bash
# Make script executable
chmod +x ~/server-setup/setup-security.sh

# Run the script
sudo ~/server-setup/setup-security.sh
```

**This script will:**
- ✅ Update all packages
- ✅ Configure UFW firewall
- ✅ Install and configure Fail2Ban
- ✅ Harden SSH configuration
- ✅ Set up automatic security updates
- ✅ Create initial security baseline

**IMPORTANT:** The script will prompt you for:
- New SSH port (default: 2222)
- Your home/office IP for SSH access
- Email for alerts

---

### Step 5: Set Up SSH Keys (DO THIS BEFORE REBOOTING)

**On your LOCAL Windows machine (new PowerShell window):**

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/frozenshield_server

# Copy public key to server (use current password)
type ~/.ssh/frozenshield_server.pub | ssh root@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Or if using ubuntu user:
type ~/.ssh/frozenshield_server.pub | ssh ubuntu@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Set correct permissions (run on server)
ssh root@YOUR_SERVER_IP "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

**Test SSH key authentication (CRITICAL - do this before disconnecting):**

```powershell
# Test new connection with key (use port 2222 if you changed it)
ssh -i ~/.ssh/frozenshield_server -p 2222 root@YOUR_SERVER_IP

# Or for ubuntu user:
ssh -i ~/.ssh/frozenshield_server -p 2222 ubuntu@YOUR_SERVER_IP
```

**If successful, you should connect without a password!**

---

### Step 6: Configure SSH Config (Local Machine)

**On your LOCAL machine, edit SSH config:**

```powershell
# Open SSH config (PowerShell)
notepad ~/.ssh/config
```

**Add this (replace YOUR_SERVER_IP):**

```
Host frozenshield-prod
    HostName YOUR_SERVER_IP
    Port 2222
    User root
    IdentityFile ~/.ssh/frozenshield_server
    LocalForward 9090 localhost:9090
    LocalForward 19999 localhost:19999
```

**Save and test:**

```powershell
# Now you can connect simply with:
ssh frozenshield-prod
```

---

### Step 7: Install Monitoring Tools

**Back on the server:**

```bash
# Create monitoring installation script
nano ~/server-setup/install-monitoring.sh
```

Copy content from `install-monitoring.sh` (I'll create this)

```bash
# Make executable and run
chmod +x ~/server-setup/install-monitoring.sh
sudo ~/server-setup/install-monitoring.sh
```

**This installs:**
- ✅ Cockpit (web management)
- ✅ Netdata (real-time monitoring)
- ✅ btop, htop, glances (terminal tools)
- ✅ ctop (Docker monitoring)
- ✅ Security scanning tools (Lynis, RKHunter, ClamAV)

---

### Step 8: Install Coolify

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

**Wait for installation to complete** (~5-10 minutes)

**Access Coolify:**
- URL: `http://YOUR_SERVER_IP:8000`
- Complete the initial setup wizard
- **IMMEDIATELY change the default password**
- Enable 2FA in settings

---

### Step 9: Secure Monitoring Tools

Since we installed Cockpit and Netdata, let's secure them:

```bash
# Option 1: Restrict by IP (recommended)
sudo ufw delete allow 9090/tcp
sudo ufw delete allow 19999/tcp
sudo ufw allow from YOUR_HOME_IP to any port 9090 proto tcp comment 'Cockpit'
sudo ufw allow from YOUR_HOME_IP to any port 19999 proto tcp comment 'Netdata'

# Option 2: Use SSH tunnels (most secure)
# Already configured in your SSH config from Step 6
# Just access via: http://localhost:9090 and http://localhost:19999
```

**Secure Coolify dashboard:**

```bash
# Restrict Coolify to your IP only
sudo ufw delete allow 8000/tcp
sudo ufw allow from YOUR_HOME_IP to any port 8000 proto tcp comment 'Coolify'

# Or use Cloudflare Tunnel (better for remote access)
# Configure in Coolify dashboard
```

---

### Step 10: Configure Backups

```bash
# Create backup script
nano ~/server-setup/setup-backups.sh
```

Copy content from `setup-backups.sh` (I'll create this)

```bash
# Make executable and run
chmod +x ~/server-setup/setup-backups.sh
sudo ~/server-setup/setup-backups.sh
```

**Configure backup destination:**
- Local: `/backups` directory
- Remote: S3, Backblaze B2, or similar (recommended)

---

### Step 11: Run Security Audit

```bash
# Run Lynis security audit
sudo lynis audit system

# Review the report
cat /var/log/lynis-report.dat

# Check hardening score
sudo lynis show hardening-index
```

**Target Score:** 75+ (Good), 85+ (Excellent)

---

### Step 12: Final Verification Checklist

Run this comprehensive check:

```bash
# Run verification script
nano ~/server-setup/verify-setup.sh
```

Copy content from `verify-setup.sh` (I'll create this)

```bash
chmod +x ~/server-setup/verify-setup.sh
./verify-setup.sh
```

**Manual Verification:**

```bash
# 1. SSH is secure
sudo sshd -t
grep -E "PermitRootLogin|PasswordAuthentication|Port" /etc/ssh/sshd_config

# 2. Firewall is active
sudo ufw status verbose

# 3. Fail2Ban is running
sudo fail2ban-client status

# 4. Docker auto-starts
systemctl is-enabled docker

# 5. Coolify containers are running
sudo docker ps

# 6. Monitoring tools are accessible
curl -I http://localhost:9090
curl -I http://localhost:19999
curl -I http://localhost:8000

# 7. Automatic updates enabled
sudo cat /etc/apt/apt.conf.d/50unattended-upgrades | grep -v "^//"
```

---

### Step 13: Document Your Setup

Create a secure document with:

```bash
# Create server documentation
nano ~/SERVER-INFO.md
```

**Include:**
```markdown
# Server Information

**Server:** FrozenShield Production
**IP:** YOUR_SERVER_IP
**Provider:** [Your provider]
**Location:** [Server location]

## Access
- SSH Port: 2222
- SSH Key: ~/.ssh/frozenshield_server
- SSH Command: `ssh frozenshield-prod`

## Services
- Cockpit: https://YOUR_SERVER_IP:9090 (or http://localhost:9090 via tunnel)
- Netdata: http://YOUR_SERVER_IP:19999 (or http://localhost:19999 via tunnel)
- Coolify: http://YOUR_SERVER_IP:8000

## Credentials
- Coolify Admin: [Store in password manager]
- Database Root: [Store in password manager]

## Backup Schedule
- Database: Daily at 2 AM
- Files: Daily at 3 AM
- Retention: 7 days local, 30 days remote

## Important Dates
- Setup Date: [Today's date]
- Next Security Audit: [30 days from now]
- SSL Renewal: [Auto via Coolify]

## Emergency Contacts
- VPS Provider Support: [Phone/Email]
- DNS Provider: [Login URL]

## Recovery Information
- Backup Location: [S3 bucket or path]
- DNS Records: [Screenshot or export]
```

**Secure this file:**
```bash
chmod 600 ~/SERVER-INFO.md
```

---

## Post-Setup Tasks (First Week)

### Day 1 (Today)
- ✅ Complete all setup steps above
- ✅ Test SSH access from local machine
- ✅ Access Coolify dashboard
- ✅ Deploy first test application
- ✅ Verify auto-start after reboot

### Day 2
- ⏳ Configure first backup
- ⏳ Test backup restoration
- ⏳ Set up Uptime Kuma monitoring
- ⏳ Configure email alerts

### Day 3-7
- ⏳ Deploy production applications
- ⏳ Configure custom domains
- ⏳ Set up SSL certificates
- ⏳ Configure CDN (Cloudflare)
- ⏳ Performance testing

### Week 2
- ⏳ Review security logs
- ⏳ Check Fail2Ban bans
- ⏳ Review Netdata metrics
- ⏳ First manual backup test

### Week 4
- ⏳ First security audit with Lynis
- ⏳ Review and update firewall rules
- ⏳ Check disk usage and clean up
- ⏳ Review application logs

---

## Quick Reference Commands

### Daily Checks
```bash
# Connect to server
ssh frozenshield-prod

# Quick health check
btop  # Press 'q' to quit

# Check services
sudo systemctl status fail2ban
sudo systemctl status docker
sudo ufw status

# Check Docker containers
sudo docker ps

# Exit
exit
```

### Weekly Checks
```bash
# Connect
ssh frozenshield-prod

# Check for updates
sudo apt update
sudo apt list --upgradable

# Apply updates
sudo apt upgrade -y

# Check disk space
df -h
ncdu /

# Check logs
sudo logwatch --detail High --range today

# Check failed login attempts
sudo fail2ban-client status sshd

# Exit
exit
```

### Monthly Checks
```bash
# Security audit
sudo lynis audit system

# Check backups
ls -lh /backups

# Test backup restoration
# [Restore to test environment]

# Update Docker images
# [Via Coolify dashboard]

# Review firewall rules
sudo ufw status numbered
```

---

## Emergency Procedures

### Can't Connect via SSH

**If you changed SSH settings and can't connect:**

1. **Use VPS provider's web console:**
   - Login to your VPS provider dashboard
   - Access web console / VNC / KVM
   - Login as root

2. **Revert SSH changes:**
   ```bash
   sudo cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
   sudo systemctl restart ssh
   ```

3. **Fix the issue:**
   - Check SSH config: `sudo nano /etc/ssh/sshd_config`
   - Test config: `sudo sshd -t`
   - Check firewall: `sudo ufw status`

### Server Compromised

1. **Immediate actions:**
   ```bash
   # Block all traffic
   sudo ufw --force reset
   sudo ufw default deny incoming
   sudo ufw default deny outgoing

   # Check active connections
   sudo netstat -tupan

   # Check processes
   ps aux
   ```

2. **Investigate:**
   ```bash
   # Check recent logins
   last
   lastlog

   # Check auth logs
   sudo grep -i "failed\|error" /var/log/auth.log

   # Check cron jobs
   sudo crontab -l
   crontab -l
   ```

3. **Recovery:**
   - Restore from known good backup
   - Rotate all credentials
   - Review all application code
   - Consider full server rebuild

### Coolify Down

```bash
# Check Coolify status
sudo docker ps | grep coolify

# Restart Coolify
sudo docker restart coolify coolify-db coolify-redis

# Check logs
sudo docker logs coolify

# If database is corrupt
# [Restore from backup]
```

---

## Important Security Reminders

1. **Never disable the firewall** - Always use UFW
2. **Never use root login** - Always use SSH keys
3. **Never commit secrets** - Use environment variables
4. **Always test backups** - Restore monthly
5. **Keep software updated** - Check weekly
6. **Monitor logs** - Review daily/weekly
7. **Use strong passwords** - 32+ characters, random
8. **Enable 2FA** - Everywhere possible
9. **Limit exposed ports** - Only what's necessary
10. **Document everything** - Future you will thank you

---

## Related Documentation

- [VPS Security Guide](VPS-SECURITY-GUIDE.md) - Complete security reference
- [Monitoring Tools Guide](VPS-MONITORING-TOOLS.md) - Detailed monitoring setup
- [Service Auto-Start Guide](SERVICE-AUTO-START-GUIDE.md) - Ensure services boot on startup

---

## Troubleshooting Common Issues

### Issue: UFW blocks SSH after enabling

**Solution:**
```bash
# Use provider console to access server
sudo ufw allow 2222/tcp
sudo ufw reload
```

### Issue: Can't access Cockpit/Netdata

**Solution:**
```bash
# Check if services are running
sudo systemctl status cockpit
sudo systemctl status netdata

# Check if ports are allowed
sudo ufw status | grep -E "9090|19999"

# Restart services
sudo systemctl restart cockpit
sudo systemctl restart netdata
```

### Issue: Docker permission denied

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
ssh frozenshield-prod

# Test
docker ps
```

### Issue: Fail2Ban not banning

**Solution:**
```bash
# Check Fail2Ban status
sudo fail2ban-client status sshd

# Check logs
sudo tail -f /var/log/fail2ban.log

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

---

## Next Steps After Setup

1. **Deploy your applications** via Coolify
2. **Configure domains** and SSL
3. **Set up CDN** (Cloudflare recommended)
4. **Configure email** (SMTP for notifications)
5. **Set up monitoring alerts** (Uptime Kuma)
6. **Create runbook** for common tasks
7. **Schedule maintenance windows**
8. **Plan disaster recovery** procedures

---

**Setup Date:** _______________
**Completed By:** _______________
**Server Ready:** ⬜ Yes ⬜ No

---

**Need help?** Review the detailed guides or reach out for support.
