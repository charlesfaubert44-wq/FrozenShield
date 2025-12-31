#!/bin/bash

#############################################
# FrozenShield Setup Verification Script
# Checks if everything is configured correctly
#############################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"

SCORE=0
TOTAL=0

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  FrozenShield Setup Verification${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "Checking system configuration..."
echo ""

#############################################
# Helper Functions
#############################################

check() {
    TOTAL=$((TOTAL + 1))
    if eval "$2" > /dev/null 2>&1; then
        echo -e "$PASS $1"
        SCORE=$((SCORE + 1))
        return 0
    else
        echo -e "$FAIL $1"
        return 1
    fi
}

warn() {
    echo -e "$WARN $1"
}

info() {
    echo -e "  ${BLUE}→${NC} $1"
}

#############################################
# System Checks
#############################################

echo -e "${YELLOW}=== System Configuration ===${NC}"

check "System is up to date" "[ \$(apt list --upgradable 2>/dev/null | wc -l) -lt 5 ]"
check "Automatic updates enabled" "systemctl is-enabled unattended-upgrades"
check "Timezone configured" "timedatectl status | grep -q 'synchronized: yes'"

echo ""

#############################################
# Firewall Checks
#############################################

echo -e "${YELLOW}=== Firewall (UFW) ===${NC}"

check "UFW is installed" "command -v ufw"
check "UFW is enabled" "sudo ufw status | grep -q 'Status: active'"
check "UFW default deny incoming" "sudo ufw status verbose | grep -q 'Default: deny (incoming)'"
check "UFW default allow outgoing" "sudo ufw status verbose | grep -q 'Default: allow (outgoing)'"
check "HTTP port 80 allowed" "sudo ufw status | grep -q '80/tcp'"
check "HTTPS port 443 allowed" "sudo ufw status | grep -q '443/tcp'"
check "SSH port configured" "sudo ufw status | grep -qE '22/tcp|2222/tcp|[0-9]+/tcp.*SSH'"

echo ""

#############################################
# SSH Checks
#############################################

echo -e "${YELLOW}=== SSH Security ===${NC}"

check "SSH service running" "systemctl is-active ssh"
check "Root login disabled" "sudo grep -q '^PermitRootLogin no' /etc/ssh/sshd_config"
check "Password authentication disabled" "sudo grep -q '^PasswordAuthentication no' /etc/ssh/sshd_config"
check "Public key authentication enabled" "sudo grep -q '^PubkeyAuthentication yes' /etc/ssh/sshd_config"
check "SSH backup config exists" "[ -f /etc/ssh/sshd_config.backup ]"

# Check SSH port
SSH_PORT=$(sudo grep -E '^Port ' /etc/ssh/sshd_config | awk '{print $2}')
if [ "$SSH_PORT" != "22" ]; then
    echo -e "$PASS SSH running on non-standard port ($SSH_PORT)"
    SCORE=$((SCORE + 1))
else
    echo -e "$WARN SSH running on default port 22 (consider changing)"
fi
TOTAL=$((TOTAL + 1))

echo ""

#############################################
# Fail2Ban Checks
#############################################

echo -e "${YELLOW}=== Fail2Ban ===${NC}"

check "Fail2Ban installed" "command -v fail2ban-client"
check "Fail2Ban service running" "systemctl is-active fail2ban"
check "Fail2Ban enabled on boot" "systemctl is-enabled fail2ban"
check "SSH jail configured" "sudo fail2ban-client status sshd"

# Show ban stats
if sudo fail2ban-client status sshd > /dev/null 2>&1; then
    BANNED=$(sudo fail2ban-client status sshd | grep "Currently banned" | awk '{print $4}')
    TOTAL_BANNED=$(sudo fail2ban-client status sshd | grep "Total banned" | awk '{print $4}')
    info "Currently banned: $BANNED, Total banned: $TOTAL_BANNED"
fi

echo ""

#############################################
# Docker Checks
#############################################

echo -e "${YELLOW}=== Docker ===${NC}"

if command -v docker > /dev/null 2>&1; then
    check "Docker installed" "command -v docker"
    check "Docker service running" "systemctl is-active docker"
    check "Docker enabled on boot" "systemctl is-enabled docker"

    # Check if user is in docker group
    if groups $USER | grep -q docker; then
        echo -e "$PASS User in docker group"
        SCORE=$((SCORE + 1))
    else
        echo -e "$WARN User not in docker group (logout/login required)"
    fi
    TOTAL=$((TOTAL + 1))

    # Check containers
    RUNNING=$(sudo docker ps -q | wc -l)
    TOTAL_CONTAINERS=$(sudo docker ps -a -q | wc -l)
    info "Containers: $RUNNING running, $TOTAL_CONTAINERS total"

    # Check restart policies
    if [ $RUNNING -gt 0 ]; then
        AUTO_RESTART=$(sudo docker inspect $(sudo docker ps -q) --format '{{.HostConfig.RestartPolicy.Name}}' | grep -c 'unless-stopped\|always')
        if [ $AUTO_RESTART -eq $RUNNING ]; then
            echo -e "$PASS All containers have auto-restart enabled"
            SCORE=$((SCORE + 1))
        else
            echo -e "$WARN Some containers don't have auto-restart enabled ($AUTO_RESTART/$RUNNING)"
        fi
        TOTAL=$((TOTAL + 1))
    fi
else
    echo -e "$WARN Docker not installed"
fi

echo ""

#############################################
# Monitoring Tools Checks
#############################################

echo -e "${YELLOW}=== Monitoring Tools ===${NC}"

if systemctl is-active cockpit > /dev/null 2>&1; then
    check "Cockpit installed and running" "systemctl is-active cockpit.socket"
    info "Access: https://$(hostname -I | awk '{print $1}'):9090"
else
    echo -e "$WARN Cockpit not installed"
fi

if systemctl is-active netdata > /dev/null 2>&1; then
    check "Netdata installed and running" "systemctl is-active netdata"
    info "Access: http://$(hostname -I | awk '{print $1}'):19999"
else
    echo -e "$WARN Netdata not installed"
fi

check "btop available" "command -v btop"
check "htop available" "command -v htop"
check "ctop available" "command -v ctop"

echo ""

#############################################
# Security Tools Checks
#############################################

echo -e "${YELLOW}=== Security Tools ===${NC}"

check "Lynis installed" "command -v lynis"
check "RKHunter installed" "command -v rkhunter"
check "ClamAV installed" "command -v clamscan"
check "Nmap installed" "command -v nmap"

echo ""

#############################################
# Coolify Checks
#############################################

echo -e "${YELLOW}=== Coolify ===${NC}"

if sudo docker ps | grep -q coolify; then
    COOLIFY_CONTAINERS=$(sudo docker ps --format '{{.Names}}' | grep coolify | wc -l)
    echo -e "$PASS Coolify running ($COOLIFY_CONTAINERS containers)"
    SCORE=$((SCORE + 1))

    # Check if Coolify is accessible
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|302"; then
        echo -e "$PASS Coolify accessible on port 8000"
        SCORE=$((SCORE + 1))
        info "Access: http://$(hostname -I | awk '{print $1}'):8000"
    else
        echo -e "$WARN Coolify not responding on port 8000"
    fi
    TOTAL=$((TOTAL + 2))
else
    echo -e "$WARN Coolify not installed or not running"
fi

echo ""

#############################################
# Backup Checks
#############################################

echo -e "${YELLOW}=== Backup Configuration ===${NC}"

check "Backup directory exists" "[ -d /backups ]"
check "Database backup directory" "[ -d /backups/databases ]"
check "Files backup directory" "[ -d /backups/files ]"

echo ""

#############################################
# Disk and Resources
#############################################

echo -e "${YELLOW}=== System Resources ===${NC}"

# Disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "$PASS Disk usage: ${DISK_USAGE}%"
    SCORE=$((SCORE + 1))
else
    echo -e "$WARN Disk usage high: ${DISK_USAGE}%"
fi
TOTAL=$((TOTAL + 1))

# Memory
MEM_AVAILABLE=$(free -m | awk 'NR==2{printf "%.0f", $7}')
MEM_TOTAL=$(free -m | awk 'NR==2{printf "%.0f", $2}')
MEM_PERCENT=$(awk "BEGIN {printf \"%.0f\", ($MEM_AVAILABLE/$MEM_TOTAL)*100}")

if [ $MEM_PERCENT -gt 20 ]; then
    echo -e "$PASS Memory available: ${MEM_PERCENT}% (${MEM_AVAILABLE}MB)"
    SCORE=$((SCORE + 1))
else
    echo -e "$WARN Memory low: only ${MEM_PERCENT}% available"
fi
TOTAL=$((TOTAL + 1))

# Load average
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
info "Load average: $LOAD"

echo ""

#############################################
# Network Checks
#############################################

echo -e "${YELLOW}=== Network Configuration ===${NC}"

check "Internet connectivity" "ping -c 1 8.8.8.8"
check "DNS resolution" "ping -c 1 google.com"

# Check open ports
OPEN_PORTS=$(sudo ss -tulpn | grep LISTEN | wc -l)
info "Open ports: $OPEN_PORTS"

echo ""

#############################################
# Security Audit
#############################################

echo -e "${YELLOW}=== Security Score ===${NC}"

if command -v lynis > /dev/null 2>&1; then
    if [ -f /var/log/lynis.log ]; then
        LYNIS_SCORE=$(grep "Hardening index" /var/log/lynis.log | tail -1 | awk '{print $4}')
        if [ -n "$LYNIS_SCORE" ]; then
            info "Last Lynis hardening index: $LYNIS_SCORE"
            echo -e "  ${BLUE}→${NC} Run: sudo lynis audit system (for fresh scan)"
        fi
    else
        echo -e "$WARN Lynis not run yet"
        echo -e "  ${BLUE}→${NC} Run: sudo lynis audit system"
    fi
fi

echo ""

#############################################
# Calculate Score
#############################################

PERCENTAGE=$((SCORE * 100 / TOTAL))

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Verification Results${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Score: $SCORE/$TOTAL ($PERCENTAGE%)"
echo ""

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent! Your server is well configured.${NC}"
elif [ $PERCENTAGE -ge 75 ]; then
    echo -e "${GREEN}✓ Good! Most security measures are in place.${NC}"
    echo -e "${YELLOW}  Review warnings above for improvements.${NC}"
elif [ $PERCENTAGE -ge 50 ]; then
    echo -e "${YELLOW}⚠ Fair. Several important items need attention.${NC}"
    echo -e "${YELLOW}  Address failed checks above.${NC}"
else
    echo -e "${RED}✗ Poor. Critical security measures missing.${NC}"
    echo -e "${RED}  Run setup scripts immediately.${NC}"
fi

echo ""

#############################################
# Recommendations
#############################################

echo -e "${YELLOW}=== Next Steps ===${NC}"
echo ""

if [ $PERCENTAGE -lt 75 ]; then
    echo "1. Review failed checks above"
    echo "2. Run setup scripts if not completed"
    echo "3. Ensure SSH keys are configured"
    echo "4. Restrict monitoring tool access by IP"
fi

echo "• Run security audit: ${BLUE}sudo lynis audit system${NC}"
echo "• Check failed logins: ${BLUE}sudo fail2ban-client status sshd${NC}"
echo "• Monitor resources: ${BLUE}btop${NC} or ${BLUE}htop${NC}"
echo "• Check Docker: ${BLUE}sudo docker ps${NC}"
echo "• View logs: ${BLUE}sudo journalctl -xe${NC}"

echo ""
echo "For detailed monitoring:"
echo "• Cockpit: https://$(hostname -I | awk '{print $1}'):9090"
echo "• Netdata: http://$(hostname -I | awk '{print $1}'):19999"
echo "• Coolify: http://$(hostname -I | awk '{print $1}'):8000"

echo ""
echo -e "${BLUE}Verification complete!${NC}"
echo ""
