# Quick Start - New Server Setup

**Estimated Time:** 30-40 minutes

## 🎯 What This Does

This guide will transform your brand new server into a production-ready, secure VPS with:
- ✅ Hardened SSH (key-based auth, non-standard port)
- ✅ Firewall configured (UFW)
- ✅ Intrusion prevention (Fail2Ban)
- ✅ Automated security updates
- ✅ Monitoring dashboards (Cockpit, Netdata)
- ✅ Coolify for app deployment
- ✅ Auto-restart on reboot for all services

---

## 📋 Before You Start

### You Need:
- ✅ Server IP address
- ✅ Root or sudo access
- ✅ Windows computer with PowerShell/WSL
- ✅ 30-40 minutes of time
- ✅ Your home/office IP address (optional, for added security)

### Get Your Home IP:
Visit: https://whatismyipaddress.com/

---

## 🚀 Step-by-Step Instructions

### Step 1: Connect to Your Server (5 min)

**On your local Windows machine (PowerShell):**

```powershell
# Connect to server
ssh root@YOUR_SERVER_IP

# Or if using ubuntu user:
ssh ubuntu@YOUR_SERVER_IP
```

Enter the password provided by your hosting provider.

---

### Step 2: Download Setup Scripts (2 min)

**On the server:**

```bash
# Update system first
sudo apt update && sudo apt upgrade -y

# Install git
sudo apt install git -y

# Clone your repository (if scripts are committed)
cd ~
git clone https://github.com/charlesfaubert44-wq/FrozenShield.git
cd FrozenShield

# Make scripts executable
chmod +x setup-security.sh install-monitoring.sh verify-setup.sh
```

**OR if scripts aren't in your repo, create them manually:**

```bash
# Create setup directory
mkdir -p ~/server-setup
cd ~/server-setup

# Download scripts directly (if you host them somewhere)
# OR copy-paste them from your local files
```

---

### Step 3: Run Security Setup (10 min)

```bash
# Run the security setup script
sudo ./setup-security.sh
```

**The script will ask you:**
1. **New SSH port** - Enter `2222` (recommended)
2. **Your home IP** - Enter your IP or `any` for anywhere
3. **Email for alerts** - Your email address
4. **Timezone** - e.g., `America/Toronto` (or press Enter to keep current)

**⚠️ IMPORTANT:** Don't disconnect after this step!

---

### Step 4: Set Up SSH Keys (5 min)

**CRITICAL: Do this BEFORE restarting SSH or disconnecting**

**On your LOCAL Windows machine (NEW PowerShell window):**

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f $HOME\.ssh\frozenshield_server

# When prompted for passphrase, press Enter (or set one for extra security)

# Copy key to server (replace with your server IP and port)
type $HOME\.ssh\frozenshield_server.pub | ssh -p 2222 root@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# Or if using ubuntu user:
type $HOME\.ssh\frozenshield_server.pub | ssh -p 2222 ubuntu@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

**Test SSH key authentication (BEFORE closing your original connection):**

```powershell
# Test connection with key
ssh -i $HOME\.ssh\frozenshield_server -p 2222 root@YOUR_SERVER_IP

# Or for ubuntu:
ssh -i $HOME\.ssh\frozenshield_server -p 2222 ubuntu@YOUR_SERVER_IP
```

**If this works without asking for a password, you're good!**

---

### Step 5: Restart SSH (1 min)

**Back on the server (in your original SSH session):**

```bash
# Only after successful key test above
sudo systemctl restart ssh

# Keep this session open, test new connection in another window
```

**In a NEW terminal, verify you can still connect:**

```powershell
ssh -i $HOME\.ssh\frozenshield_server -p 2222 root@YOUR_SERVER_IP
```

If successful, close the old connection.

---

### Step 6: Install Monitoring Tools (10 min)

**On the server:**

```bash
cd ~/FrozenShield  # or ~/server-setup

# Run monitoring installation
sudo ./install-monitoring.sh
```

This installs:
- Cockpit (web management)
- Netdata (real-time monitoring)
- btop, htop, glances (terminal tools)
- ctop (Docker monitoring)
- Lynis, RKHunter, ClamAV (security tools)

---

### Step 7: Install Coolify (5 min)

```bash
# Install Docker first
curl -fsSL https://get.docker.com | sudo bash

# Add your user to docker group
sudo usermod -aG docker $USER

# Logout and login for group to take effect
exit

# SSH back in
ssh -i $HOME/.ssh/frozenshield_server -p 2222 root@YOUR_SERVER_IP

# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Wait for Coolify to install (~5-10 minutes).

---

### Step 8: Access and Secure Coolify (3 min)

**Open in browser:**
- URL: `http://YOUR_SERVER_IP:8000`

**First-time setup:**
1. Create admin account with STRONG password
2. Save credentials in password manager
3. Go to Settings → Security → Enable 2FA
4. Complete setup wizard

**Restrict Coolify access (recommended):**

```bash
# Restrict to your IP only
sudo ufw delete allow 8000/tcp
sudo ufw allow from YOUR_HOME_IP to any port 8000 proto tcp comment 'Coolify'
```

---

### Step 9: Secure Monitoring Tools (2 min)

```bash
# Option 1: Restrict to your IP (recommended)
sudo ufw delete allow 9090/tcp
sudo ufw delete allow 19999/tcp
sudo ufw allow from YOUR_HOME_IP to any port 9090 proto tcp comment 'Cockpit'
sudo ufw allow from YOUR_HOME_IP to any port 19999 proto tcp comment 'Netdata'

# Option 2: Keep open but use SSH tunnel (most secure)
# Configure SSH tunnel in next step
```

---

### Step 10: Configure SSH Config (3 min)

**On your LOCAL Windows machine:**

```powershell
# Create/edit SSH config
notepad $HOME\.ssh\config
```

**Add this configuration:**

```
Host frozenshield
    HostName YOUR_SERVER_IP
    Port 2222
    User root
    IdentityFile ~/.ssh/frozenshield_server
    LocalForward 9090 localhost:9090
    LocalForward 19999 localhost:19999
    LocalForward 3001 localhost:3001
```

**Save and test:**

```powershell
# Now you can connect simply with:
ssh frozenshield

# With tunnels, access monitoring at:
# http://localhost:9090  - Cockpit
# http://localhost:19999 - Netdata
# http://localhost:3001  - Uptime Kuma (when installed)
```

---

### Step 11: Verify Setup (2 min)

**On the server:**

```bash
# Run verification script
cd ~/FrozenShield  # or ~/server-setup
./verify-setup.sh
```

**You should see a score of 75%+**

If score is lower, review failed checks and fix issues.

---

### Step 12: Test Reboot (2 min)

```bash
# Reboot server
sudo reboot

# Wait 2-3 minutes, then reconnect
ssh frozenshield

# Check everything started
sudo docker ps
systemctl status fail2ban
sudo ufw status
```

**Expected:**
- All Docker containers running
- Fail2Ban active
- Firewall active

---

## ✅ You're Done!

Your server is now:
- ✅ Secure (SSH hardened, firewall configured)
- ✅ Monitored (Cockpit, Netdata)
- ✅ Ready for apps (Coolify installed)
- ✅ Auto-recovering (all services restart on boot)

---

## 🎯 What's Next?

### Immediate (Today)
1. **Deploy first app** via Coolify
2. **Set up domain** and SSL
3. **Configure backups** (see backup guide)

### This Week
1. **Install Uptime Kuma** for service monitoring
2. **Run security scan**: `sudo lynis audit system`
3. **Test backup restoration**
4. **Set up email alerts**

### Ongoing
- **Daily**: Quick health check (`btop` or Netdata)
- **Weekly**: Check for updates, review logs
- **Monthly**: Security audit, backup test

---

## 📚 Reference Commands

### Daily Use

```bash
# Connect to server
ssh frozenshield

# Quick health check
btop

# Check Docker containers
docker ps

# Check banned IPs
sudo fail2ban-client status sshd

# Exit
exit
```

### Access Monitoring

**With SSH tunnel (most secure):**
```bash
# Connect with tunnels
ssh frozenshield

# Then open in browser:
# http://localhost:9090  - Cockpit
# http://localhost:19999 - Netdata
```

**Direct access:**
- Cockpit: `https://YOUR_SERVER_IP:9090`
- Netdata: `http://YOUR_SERVER_IP:19999`
- Coolify: `http://YOUR_SERVER_IP:8000`

### Useful Aliases

After running scripts, you have these aliases:

```bash
health      # Quick health check
monitor     # Launch btop
dockermon   # Launch ctop (Docker monitor)
logs        # View system logs
ports       # Show open ports
banned      # Show Fail2Ban banned IPs
```

---

## 🆘 Troubleshooting

### Can't connect via SSH

**Use your hosting provider's web console:**
1. Login to provider dashboard
2. Access VNC/KVM/Console
3. Login as root
4. Check SSH config: `sudo nano /etc/ssh/sshd_config`
5. Check firewall: `sudo ufw status`

### Forgot to set up SSH keys

**If locked out:**
1. Use provider web console
2. Add your public key manually:
   ```bash
   mkdir -p ~/.ssh
   echo "your-public-key-here" >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### Coolify not accessible

```bash
# Check if running
sudo docker ps | grep coolify

# Restart if needed
sudo docker restart coolify coolify-db coolify-redis

# Check logs
sudo docker logs coolify
```

### Firewall blocked me out

**Use provider console:**
```bash
# Allow your IP
sudo ufw allow from YOUR_IP to any port 2222 proto tcp

# Or temporarily disable (NOT recommended)
sudo ufw disable
# Fix issue, then re-enable
sudo ufw enable
```

---

## 📞 Need Help?

**Check the detailed guides:**
- [VPS Security Guide](VPS-SECURITY-GUIDE.md)
- [Monitoring Tools Guide](VPS-MONITORING-TOOLS.md)
- [Service Auto-Start Guide](SERVICE-AUTO-START-GUIDE.md)
- [New Server Setup](NEW-SERVER-SETUP.md) (detailed version)

**Community Resources:**
- Coolify Discord: https://coolify.io/discord
- Ubuntu Forums: https://ubuntuforums.org/
- DigitalOcean Community: https://www.digitalocean.com/community

---

## ✨ Pro Tips

1. **Always keep your current SSH session open** when testing new configurations
2. **Test SSH keys** before disabling password authentication
3. **Use SSH tunnels** for accessing monitoring tools (most secure)
4. **Enable 2FA** on Coolify and any public-facing services
5. **Document everything** - future you will thank you
6. **Test backups monthly** - backups are useless if they don't restore
7. **Use password manager** for all credentials
8. **Keep server updated** - check weekly for security updates
9. **Monitor Fail2Ban** - check banned IPs regularly
10. **Plan for disasters** - have a recovery procedure documented

---

**Enjoy your secure, monitored, production-ready server! 🎉**
