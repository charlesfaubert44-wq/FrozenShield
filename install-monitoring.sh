#!/bin/bash

#############################################
# FrozenShield Monitoring Tools Installation
# Installs Cockpit, Netdata, and CLI tools
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Monitoring Tools Installation${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

ORIGINAL_USER="${SUDO_USER:-$USER}"
echo -e "${YELLOW}Installing monitoring tools...${NC}"
echo ""

#############################################
# Step 1: Update System
#############################################

echo -e "${YELLOW}[1/6] Updating package lists...${NC}"
apt update
echo -e "${GREEN}✓ Package lists updated${NC}"
echo ""

#############################################
# Step 2: Install Cockpit
#############################################

echo -e "${YELLOW}[2/6] Installing Cockpit...${NC}"
apt install -y cockpit cockpit-pcp cockpit-networkmanager cockpit-packagekit cockpit-storaged

# Enable and start Cockpit
systemctl enable --now cockpit.socket

# Allow through firewall
ufw allow 9090/tcp comment 'Cockpit Web Console'

echo -e "${GREEN}✓ Cockpit installed${NC}"
echo "   Access: https://$(hostname -I | awk '{print $1}'):9090"
echo ""

#############################################
# Step 3: Install Netdata
#############################################

echo -e "${YELLOW}[3/6] Installing Netdata...${NC}"
echo "   This may take a few minutes..."

# Download and run Netdata installer
wget -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh
sh /tmp/netdata-kickstart.sh --stable-channel --disable-telemetry --non-interactive

# Allow through firewall
ufw allow 19999/tcp comment 'Netdata Monitoring'

echo -e "${GREEN}✓ Netdata installed${NC}"
echo "   Access: http://$(hostname -I | awk '{print $1}'):19999"
echo ""

#############################################
# Step 4: Install Terminal Tools
#############################################

echo -e "${YELLOW}[4/6] Installing terminal monitoring tools...${NC}"

# Install btop (modern resource monitor)
apt install -y btop || {
    echo -e "${YELLOW}   btop not in repos, installing from snap...${NC}"
    snap install btop 2>/dev/null || echo -e "${YELLOW}   btop installation skipped${NC}"
}

# Install other terminal tools
apt install -y htop glances ncdu iftop

echo -e "${GREEN}✓ Terminal tools installed${NC}"
echo "   Run: btop, htop, glances, ncdu, or iftop"
echo ""

#############################################
# Step 5: Install Docker Monitoring Tools
#############################################

echo -e "${YELLOW}[5/6] Installing Docker monitoring tools...${NC}"

# Install ctop
wget -O /usr/local/bin/ctop https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64
chmod +x /usr/local/bin/ctop

echo -e "${GREEN}✓ Docker tools installed${NC}"
echo "   Run: ctop (for Docker container monitoring)"
echo ""

#############################################
# Step 6: Install Security Scanning Tools
#############################################

echo -e "${YELLOW}[6/6] Installing security scanning tools...${NC}"

# Install security tools
apt install -y lynis rkhunter clamav clamav-daemon nmap

# Update ClamAV database
echo "   Updating ClamAV database (this may take a while)..."
systemctl stop clamav-freshclam 2>/dev/null || true
freshclam || echo -e "${YELLOW}   ClamAV update will complete in background${NC}"
systemctl start clamav-freshclam 2>/dev/null || true

# Update RKHunter database
rkhunter --update || true
rkhunter --propupd || true

echo -e "${GREEN}✓ Security tools installed${NC}"
echo "   Run: sudo lynis audit system"
echo "   Run: sudo rkhunter --check"
echo ""

#############################################
# Create Monitoring Aliases
#############################################

echo -e "${YELLOW}Creating helpful aliases...${NC}"

cat >> /home/"$ORIGINAL_USER"/.bashrc <<'EOF'

# FrozenShield Monitoring Aliases
alias health='sudo /usr/local/bin/check-services.sh'
alias monitor='btop'
alias dockermon='ctop'
alias logs='sudo journalctl -xe'
alias ports='sudo ss -tulpn'
alias banned='sudo fail2ban-client status sshd'
EOF

chown "$ORIGINAL_USER":"$ORIGINAL_USER" /home/"$ORIGINAL_USER"/.bashrc

echo -e "${GREEN}✓ Aliases created${NC}"
echo ""

#############################################
# Final Summary
#############################################

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Installed Tools:${NC}"
echo ""
echo "📊 Web Interfaces:"
echo "  • Cockpit:  https://$(hostname -I | awk '{print $1}'):9090"
echo "  • Netdata:  http://$(hostname -I | awk '{print $1}'):19999"
echo ""
echo "💻 Terminal Tools:"
echo "  • btop       - Modern resource monitor"
echo "  • htop       - Classic process viewer"
echo "  • glances    - Comprehensive system monitor"
echo "  • ctop       - Docker container monitor"
echo "  • ncdu       - Disk usage analyzer"
echo "  • iftop      - Network traffic monitor"
echo ""
echo "🔒 Security Tools:"
echo "  • lynis      - Security auditing"
echo "  • rkhunter   - Rootkit detection"
echo "  • clamav     - Antivirus scanning"
echo "  • nmap       - Network scanning"
echo ""
echo "⌨️  Helpful Aliases (reload shell first):"
echo "  • health     - Quick health check"
echo "  • monitor    - Launch btop"
echo "  • dockermon  - Launch ctop"
echo "  • logs       - View system logs"
echo "  • ports      - Show open ports"
echo "  • banned     - Show Fail2Ban status"
echo ""
echo -e "${RED}⚠ Security Recommendations:${NC}"
echo ""
echo "1. Restrict Cockpit and Netdata to your IP:"
echo "   ${YELLOW}sudo ufw delete allow 9090/tcp${NC}"
echo "   ${YELLOW}sudo ufw delete allow 19999/tcp${NC}"
echo "   ${YELLOW}sudo ufw allow from YOUR_HOME_IP to any port 9090 proto tcp${NC}"
echo "   ${YELLOW}sudo ufw allow from YOUR_HOME_IP to any port 19999 proto tcp${NC}"
echo ""
echo "2. Or use SSH tunnels (most secure):"
echo "   ${YELLOW}ssh -L 9090:localhost:9090 -L 19999:localhost:19999 user@server${NC}"
echo "   Then access: http://localhost:9090 and http://localhost:19999"
echo ""
echo "3. Run first security scan:"
echo "   ${YELLOW}sudo lynis audit system${NC}"
echo ""
echo -e "${GREEN}Reload your shell to use new aliases:${NC}"
echo "   ${YELLOW}source ~/.bashrc${NC}"
echo ""
