#!/bin/bash

#############################################
# FrozenShield VPS Security Setup Script
# Automates initial server hardening
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  FrozenShield VPS Security Setup${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

# Get original user (not root)
ORIGINAL_USER="${SUDO_USER:-$USER}"
echo -e "${YELLOW}Running as user: $ORIGINAL_USER${NC}"
echo ""

#############################################
# Configuration
#############################################

echo -e "${YELLOW}=== Configuration ===${NC}"
echo ""

# SSH Port
read -p "Enter new SSH port (default: 2222): " SSH_PORT
SSH_PORT=${SSH_PORT:-2222}

# Home IP for SSH access
read -p "Enter your home/office IP for SSH access (or 'any' for anywhere): " HOME_IP
if [ "$HOME_IP" = "any" ]; then
    HOME_IP=""
fi

# Email for alerts
read -p "Enter email for security alerts: " ADMIN_EMAIL

# Timezone
echo ""
echo "Current timezone: $(timedatectl show -p Timezone --value)"
read -p "Enter timezone (e.g., America/Toronto) or press Enter to keep current: " TIMEZONE
if [ -n "$TIMEZONE" ]; then
    timedatectl set-timezone "$TIMEZONE" || echo -e "${YELLOW}Invalid timezone, keeping current${NC}"
fi

echo ""
echo -e "${GREEN}Configuration complete. Starting setup...${NC}"
echo ""
sleep 2

#############################################
# Step 1: Update System
#############################################

echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt update
apt upgrade -y
apt autoremove -y
apt autoclean
echo -e "${GREEN}✓ System updated${NC}"
echo ""

#############################################
# Step 2: Install Essential Packages
#############################################

echo -e "${YELLOW}[2/10] Installing essential packages...${NC}"
apt install -y \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-listchanges \
    logwatch \
    curl \
    wget \
    git \
    htop \
    ncdu \
    net-tools \
    mailutils \
    vim \
    gnupg2 \
    ca-certificates \
    lsb-release

echo -e "${GREEN}✓ Essential packages installed${NC}"
echo ""

#############################################
# Step 3: Configure UFW Firewall
#############################################

echo -e "${YELLOW}[3/10] Configuring UFW firewall...${NC}"

# Reset UFW to default
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH on new port
if [ -n "$HOME_IP" ]; then
    ufw allow from "$HOME_IP" to any port "$SSH_PORT" proto tcp comment 'SSH from home'
else
    ufw allow "$SSH_PORT"/tcp comment 'SSH'
fi

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Allow Coolify (will be restricted later)
ufw allow 8000/tcp comment 'Coolify Dashboard'

# Enable UFW
ufw --force enable

# Enable UFW on boot
systemctl enable ufw

echo -e "${GREEN}✓ Firewall configured${NC}"
ufw status verbose
echo ""

#############################################
# Step 4: Harden SSH Configuration
#############################################

echo -e "${YELLOW}[4/10] Hardening SSH configuration...${NC}"

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Create new SSH config
cat > /etc/ssh/sshd_config <<EOF
# FrozenShield SSH Configuration
# Generated: $(date)

# Port and Listen
Port $SSH_PORT
AddressFamily inet
ListenAddress 0.0.0.0

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
HostbasedAuthentication no
IgnoreRhosts yes
MaxAuthTries 3
MaxSessions 5
LoginGraceTime 30

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Subsystems
Subsystem sftp /usr/lib/openssh/sftp-server

# Strong Ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Allow specific user
AllowUsers $ORIGINAL_USER
EOF

# Test SSH configuration
if sshd -t; then
    echo -e "${GREEN}✓ SSH configuration valid${NC}"
else
    echo -e "${RED}✗ SSH configuration invalid, restoring backup${NC}"
    cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
    exit 1
fi

# Don't restart SSH yet - user needs to set up keys first
echo -e "${YELLOW}⚠ SSH not restarted yet - set up SSH keys first!${NC}"
echo ""

#############################################
# Step 5: Configure Fail2Ban
#############################################

echo -e "${YELLOW}[5/10] Configuring Fail2Ban...${NC}"

# Create local jail configuration
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = $ADMIN_EMAIL
sendername = Fail2Ban-FrozenShield
action = %(action_mwl)s

[sshd]
enabled = true
port = $SSH_PORT
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
findtime = 600

[sshd-ddos]
enabled = true
port = $SSH_PORT
logpath = /var/log/auth.log
maxretry = 2
bantime = 14400
findtime = 300
EOF

# Enable and start Fail2Ban
systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}✓ Fail2Ban configured${NC}"
fail2ban-client status
echo ""

#############################################
# Step 6: Configure Automatic Updates
#############################################

echo -e "${YELLOW}[6/10] Configuring automatic security updates...${NC}"

# Configure unattended-upgrades
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
Unattended-Upgrade::Mail "$ADMIN_EMAIL";
Unattended-Upgrade::MailReport "on-change";
EOF

# Enable automatic updates
cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF

echo -e "${GREEN}✓ Automatic updates configured${NC}"
echo ""

#############################################
# Step 7: Configure Sudo Security
#############################################

echo -e "${YELLOW}[7/10] Hardening sudo configuration...${NC}"

# Create sudo log directory
mkdir -p /var/log/sudo

# Configure sudoers
cat > /etc/sudoers.d/custom-security <<EOF
# Sudo security configuration
Defaults    timestamp_timeout=5
Defaults    passwd_timeout=1
Defaults    passwd_tries=3
Defaults    logfile="/var/log/sudo.log"
Defaults    log_input,log_output
Defaults    use_pty
EOF

chmod 440 /etc/sudoers.d/custom-security

echo -e "${GREEN}✓ Sudo security configured${NC}"
echo ""

#############################################
# Step 8: Create Backup Directory Structure
#############################################

echo -e "${YELLOW}[8/10] Creating backup directory structure...${NC}"

mkdir -p /backups/{databases,files,coolify}
chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" /backups
chmod 700 /backups

echo -e "${GREEN}✓ Backup directories created${NC}"
echo ""

#############################################
# Step 9: Configure Logwatch
#############################################

echo -e "${YELLOW}[9/10] Configuring log monitoring...${NC}"

# Create logwatch daily cron
cat > /etc/cron.daily/00logwatch <<EOF
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto $ADMIN_EMAIL --detail med --range yesterday
EOF

chmod +x /etc/cron.daily/00logwatch

echo -e "${GREEN}✓ Log monitoring configured${NC}"
echo ""

#############################################
# Step 10: Create Monitoring Scripts
#############################################

echo -e "${YELLOW}[10/10] Creating monitoring scripts...${NC}"

# Create service health check script
cat > /usr/local/bin/check-services.sh <<'EOFSCRIPT'
#!/bin/bash
echo "=== Service Health Check ==="
echo "Timestamp: $(date)"
echo ""
echo "SSH: $(systemctl is-active ssh)"
echo "UFW: $(systemctl is-active ufw)"
echo "Fail2Ban: $(systemctl is-active fail2ban)"
echo "Docker: $(systemctl is-active docker 2>/dev/null || echo 'not installed')"
echo ""
echo "Firewall Status:"
ufw status | head -n 5
echo ""
echo "Fail2Ban Status:"
fail2ban-client status sshd 2>/dev/null || echo "Not configured yet"
echo ""
echo "Disk Usage:"
df -h / | tail -n 1
echo ""
echo "Memory Usage:"
free -h | grep Mem
echo ""
echo "=== End Health Check ==="
EOFSCRIPT

chmod +x /usr/local/bin/check-services.sh

# Create disk space monitor
cat > /usr/local/bin/check-disk-space.sh <<'EOFSCRIPT'
#!/bin/bash
THRESHOLD=80
CURRENT=$(df / | grep / | awk '{ print $5}' | sed 's/%//g')

if [ "$CURRENT" -gt "$THRESHOLD" ]; then
    echo "WARNING: Disk space at ${CURRENT}%"
    df -h /
fi
EOFSCRIPT

chmod +x /usr/local/bin/check-disk-space.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 */6 * * * /usr/local/bin/check-disk-space.sh") | crontab -

echo -e "${GREEN}✓ Monitoring scripts created${NC}"
echo ""

#############################################
# Final Summary
#############################################

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Security Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Configuration Summary:${NC}"
echo "  • SSH Port: $SSH_PORT"
echo "  • SSH Config: Hardened (root login disabled, password auth disabled)"
echo "  • Firewall: Enabled (UFW)"
echo "  • Fail2Ban: Active"
echo "  • Auto Updates: Enabled"
echo "  • Email Alerts: $ADMIN_EMAIL"
if [ -n "$HOME_IP" ]; then
echo "  • SSH Access: Restricted to $HOME_IP"
else
echo "  • SSH Access: Open (any IP)"
fi
echo ""
echo -e "${RED}⚠ CRITICAL NEXT STEPS:${NC}"
echo ""
echo "1. Set up SSH keys from your local machine:"
echo "   ${YELLOW}ssh-keygen -t ed25519 -C \"your-email@example.com\" -f ~/.ssh/frozenshield_server${NC}"
echo "   ${YELLOW}ssh-copy-id -p $SSH_PORT $ORIGINAL_USER@\$(hostname -I | awk '{print \$1}')${NC}"
echo ""
echo "2. Test SSH key authentication (BEFORE disconnecting):"
echo "   ${YELLOW}ssh -i ~/.ssh/frozenshield_server -p $SSH_PORT $ORIGINAL_USER@\$(hostname -I | awk '{print \$1}')${NC}"
echo ""
echo "3. Only AFTER successful key authentication, restart SSH:"
echo "   ${YELLOW}sudo systemctl restart ssh${NC}"
echo ""
echo "4. Run health check:"
echo "   ${YELLOW}/usr/local/bin/check-services.sh${NC}"
echo ""
echo -e "${YELLOW}Backup of original SSH config: /etc/ssh/sshd_config.backup${NC}"
echo ""
echo -e "${GREEN}Review the output above and proceed with next steps!${NC}"
echo ""
