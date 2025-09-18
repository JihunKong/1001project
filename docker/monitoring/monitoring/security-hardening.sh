#!/bin/bash

# ============================================
# 1001 Stories Security Hardening Script
# 프로덕션 서버 보안 강화 및 방화벽 설정
# ============================================

set -e

# 컬러 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로깅 함수
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 시스템 업데이트 및 보안 패키지 설치
install_security_packages() {
    log "${YELLOW}Installing security packages...${NC}"
    
    # 시스템 업데이트
    apt-get update && apt-get upgrade -y
    
    # 필수 보안 패키지 설치
    apt-get install -y \
        ufw \
        fail2ban \
        unattended-upgrades \
        apt-listchanges \
        logwatch \
        rkhunter \
        chkrootkit \
        aide \
        lynis \
        auditd \
        psad \
        apparmor-utils
    
    log "${GREEN}✓ Security packages installed${NC}"
}

# UFW 방화벽 설정
configure_firewall() {
    log "${YELLOW}Configuring UFW firewall...${NC}"
    
    # UFW 리셋 및 기본 정책 설정
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # SSH 접근 허용 (특정 IP에서만 - 필요시 수정)
    ufw allow ssh
    # ufw allow from YOUR_ADMIN_IP to any port ssh  # 특정 IP에서만 SSH 허용
    
    # 웹 서비스 허용
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    
    # 애플리케이션 포트 차단 (nginx를 통해서만 접근)
    ufw deny 3000/tcp  # Next.js
    ufw deny 5432/tcp  # PostgreSQL
    ufw deny 5050/tcp  # pgAdmin
    
    # 모니터링 포트 (내부 접근만)
    ufw allow from 172.20.0.0/24 to any port 9090  # Prometheus
    ufw allow from 172.20.0.0/24 to any port 3001  # Grafana
    ufw allow from 172.20.0.0/24 to any port 9093  # Alertmanager
    
    # ICMP 허용 (ping)
    ufw allow from any to any port 22 proto icmp
    
    # UFW 로깅 활성화
    ufw logging on
    
    # 방화벽 활성화
    ufw --force enable
    
    # 상태 확인
    ufw status verbose
    
    log "${GREEN}✓ UFW firewall configured${NC}"
}

# Fail2Ban 설정
configure_fail2ban() {
    log "${YELLOW}Configuring Fail2Ban...${NC}"
    
    # Fail2Ban 로컬 설정 파일 생성
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# 기본 밴 시간: 1시간
bantime = 3600

# 재시도 횟수: 5회
maxretry = 5

# 감시 시간 창: 10분
findtime = 600

# 무시할 IP (관리자 IP 추가 권장)
ignoreip = 127.0.0.1/8 ::1
# ignoreip = 127.0.0.1/8 ::1 YOUR_ADMIN_IP

# SSH 보호
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 1800

# Nginx HTTP Auth 보호
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

# Nginx limit req 보호
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600

# Nginx bad bots 차단
[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400

# PostgreSQL 보호 (필요시)
[postgresql]
enabled = false
filter = postgresql
logpath = /var/log/postgresql/*.log
maxretry = 3
bantime = 3600
EOF

    # 추가 필터 생성
    cat > /etc/fail2ban/filter.d/nginx-badbots.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*"(GET|POST).*HTTP.*".*".*bot.*$
            ^<HOST> -.*"(GET|POST).*HTTP.*".*".*crawler.*$
            ^<HOST> -.*"(GET|POST).*HTTP.*".*".*spider.*$
ignoreregex =
EOF

    # Fail2Ban 재시작 및 활성화
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    # 상태 확인
    fail2ban-client status
    
    log "${GREEN}✓ Fail2Ban configured${NC}"
}

# SSH 보안 강화
harden_ssh() {
    log "${YELLOW}Hardening SSH configuration...${NC}"
    
    # SSH 설정 백업
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)
    
    # SSH 보안 설정
    cat > /etc/ssh/sshd_config.d/99-security-hardening.conf << 'EOF'
# SSH 보안 강화 설정

# 프로토콜 버전 2만 사용
Protocol 2

# 루트 로그인 금지
PermitRootLogin no

# 패스워드 인증 금지 (키 인증만 허용)
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# 빈 패스워드 금지
PermitEmptyPasswords no

# X11 포워딩 금지
X11Forwarding no

# 로그인 시간 제한
LoginGraceTime 30

# 최대 동시 접속 수 제한
MaxSessions 3

# 최대 인증 시도 횟수
MaxAuthTries 3

# TCP 포워딩 제한
AllowTcpForwarding no
GatewayPorts no

# 사용자 환경 파일 무시
PermitUserEnvironment no

# 호스트 기반 인증 금지
HostbasedAuthentication no
IgnoreUserKnownHosts yes

# DNS 조회 비활성화 (속도 향상)
UseDNS no

# 로그 레벨 설정
LogLevel VERBOSE

# 클라이언트 활성 상태 확인
ClientAliveInterval 300
ClientAliveCountMax 2

# 접속 허용 사용자 (필요시 수정)
AllowUsers ubuntu
EOF

    # SSH 서비스 재시작
    systemctl restart sshd
    
    log "${GREEN}✓ SSH hardened${NC}"
}

# 자동 업데이트 설정
configure_auto_updates() {
    log "${YELLOW}Configuring automatic security updates...${NC}"
    
    # unattended-upgrades 설정
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id} ESMApps:${distro_codename}-apps-security";
    "${distro_id} ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::Package-Blacklist {
    // "vim";
    // "libc6-dev";
    // "libstdc++6";
};

Unattended-Upgrade::DevRelease "auto";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-WithUsers "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";

Unattended-Upgrade::Mail "admin@1001stories.org";
Unattended-Upgrade::MailReport "on-change";
EOF

    # 자동 업데이트 활성화
    cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

    # 서비스 활성화
    systemctl enable unattended-upgrades
    systemctl restart unattended-upgrades
    
    log "${GREEN}✓ Automatic security updates configured${NC}"
}

# 시스템 감사 설정
configure_auditing() {
    log "${YELLOW}Configuring system auditing...${NC}"
    
    # auditd 규칙 설정
    cat > /etc/audit/rules.d/1001stories.rules << 'EOF'
# 1001 Stories 감사 규칙

# 시스템 콜 감시
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b32 -S adjtimex -S settimeofday -S stime -k time-change

# 네트워크 환경 변경 감시
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k system-locale
-a always,exit -F arch=b32 -S sethostname -S setdomainname -k system-locale
-w /etc/issue -p wa -k system-locale
-w /etc/issue.net -p wa -k system-locale
-w /etc/hosts -p wa -k system-locale
-w /etc/sysconfig/network -p wa -k system-locale

# 권한 변경 감시
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b64 -S chown -S fchown -S fchownat -S lchown -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S chown -S fchown -S fchownat -S lchown -F auid>=1000 -F auid!=4294967295 -k perm_mod

# 로그인 감시
-w /var/log/faillog -p wa -k logins
-w /var/log/lastlog -p wa -k logins
-w /var/log/tallylog -p wa -k logins

# 세션 시작 감시
-w /var/run/utmp -p wa -k session
-w /var/log/wtmp -p wa -k logins
-w /var/log/btmp -p wa -k logins

# 중요 파일 변경 감시
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/security/opasswd -p wa -k identity

# Docker 관련 감시
-w /usr/bin/docker -p wa -k docker
-w /var/lib/docker -p wa -k docker
-w /etc/docker -p wa -k docker

# 1001 Stories 애플리케이션 감시
-w /home/ubuntu/1001-stories -p wa -k app-changes
EOF

    # auditd 재시작
    systemctl enable auditd
    systemctl restart auditd
    
    log "${GREEN}✓ System auditing configured${NC}"
}

# 로그 모니터링 설정
configure_log_monitoring() {
    log "${YELLOW}Configuring log monitoring...${NC}"
    
    # logwatch 설정
    cat > /etc/logwatch/conf/logwatch.conf << 'EOF'
LogDir = /var/log
MailTo = admin@1001stories.org
MailFrom = logwatch@1001stories.org
Print = No
Mail = Yes
Save = /tmp/logwatch
Range = yesterday
Detail = Med
Service = All
Service = -zz-network
Service = -zz-sys
Service = -eximstats
EOF

    # 일일 로그 리포트 cron 작업 추가
    cat > /etc/cron.daily/00logwatch << 'EOF'
#!/bin/bash
/usr/sbin/logwatch --output mail --format html --mailto admin@1001stories.org --range yesterday --detail med
EOF
    
    chmod +x /etc/cron.daily/00logwatch
    
    log "${GREEN}✓ Log monitoring configured${NC}"
}

# 커널 보안 파라미터 설정
configure_kernel_hardening() {
    log "${YELLOW}Configuring kernel security parameters...${NC}"
    
    cat > /etc/sysctl.d/99-security-hardening.conf << 'EOF'
# 1001 Stories 시스템 보안 강화 설정

# IP 스푸핑 방지
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.default.rp_filter=1

# IP 포워딩 비활성화
net.ipv4.ip_forward=0
net.ipv6.conf.all.forwarding=0

# ICMP 리디렉션 비활성화
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.default.accept_redirects=0
net.ipv6.conf.all.accept_redirects=0
net.ipv6.conf.default.accept_redirects=0

# ICMP 리디렉션 전송 비활성화
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0

# 소스 라우팅 비활성화
net.ipv4.conf.all.accept_source_route=0
net.ipv4.conf.default.accept_source_route=0
net.ipv6.conf.all.accept_source_route=0
net.ipv6.conf.default.accept_source_route=0

# SYN 쿠키 활성화 (SYN flood 공격 방지)
net.ipv4.tcp_syncookies=1

# 핑 응답 비활성화 (선택사항)
# net.ipv4.icmp_echo_ignore_all=1

# TCP timestamps 비활성화
net.ipv4.tcp_timestamps=0

# IPv6 라우터 광고 무시
net.ipv6.conf.all.accept_ra=0
net.ipv6.conf.default.accept_ra=0

# 로그 마티안 패킷
net.ipv4.conf.all.log_martians=1

# TCP keepalive 설정
net.ipv4.tcp_keepalive_time=600
net.ipv4.tcp_keepalive_probes=3
net.ipv4.tcp_keepalive_intvl=15

# 파일 디스크립터 제한 증가
fs.file-max=2097152

# 가상 메모리 설정
vm.swappiness=10
vm.dirty_ratio=15
vm.dirty_background_ratio=5

# 커널 덤프 비활성화
kernel.core_dump=0

# dmesg 액세스 제한
kernel.dmesg_restrict=1

# 커널 포인터 숨기기
kernel.kptr_restrict=2

# ptrace 제한
kernel.yama.ptrace_scope=1

# 프로세스 PID 제한 증가
kernel.pid_max=4194304
EOF

    # 설정 적용
    sysctl -p /etc/sysctl.d/99-security-hardening.conf
    
    log "${GREEN}✓ Kernel security parameters configured${NC}"
}

# AppArmor 보안 프로필 설정
configure_apparmor() {
    log "${YELLOW}Configuring AppArmor security profiles...${NC}"
    
    # AppArmor 활성화
    systemctl enable apparmor
    systemctl start apparmor
    
    # 모든 프로필을 enforce 모드로 설정
    aa-enforce /etc/apparmor.d/*
    
    # Docker 관련 프로필 생성
    cat > /etc/apparmor.d/docker-1001stories << 'EOF'
#include <tunables/global>

profile docker-1001stories flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  network,
  capability,
  file,
  umount,

  deny @{PROC}/* w,   # 프로세스 정보 쓰기 금지
  deny @{PROC}/[0-9]*/kcore r,  # 커널 코어 덤프 읽기 금지
  deny @{PROC}/kmem r,  # 커널 메모리 읽기 금지
  deny @{PROC}/mem r,   # 메모리 읽기 금지
  
  # 애플리케이션 디렉토리 접근 허용
  /home/ubuntu/1001-stories/** rw,
  
  # 로그 디렉토리 접근 허용
  /var/log/1001stories/** rw,
}
EOF

    # 프로필 로드 및 활성화
    apparmor_parser -r /etc/apparmor.d/docker-1001stories
    
    log "${GREEN}✓ AppArmor configured${NC}"
}

# 무결성 검사 도구 설정
configure_integrity_checking() {
    log "${YELLOW}Configuring file integrity monitoring...${NC}"
    
    # AIDE 초기 데이터베이스 생성
    aideinit
    mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
    
    # 정기적 무결성 검사 cron 작업 추가
    cat > /etc/cron.daily/aide-check << 'EOF'
#!/bin/bash
/usr/bin/aide --check --config /etc/aide/aide.conf | mail -s "AIDE Integrity Check - $(hostname)" admin@1001stories.org
EOF
    
    chmod +x /etc/cron.daily/aide-check
    
    # rkhunter 설정 업데이트
    rkhunter --update
    rkhunter --propupd
    
    # 정기적 루트킷 검사 cron 작업 추가
    cat > /etc/cron.weekly/rkhunter-check << 'EOF'
#!/bin/bash
/usr/bin/rkhunter --checkall --skip-keypress --report-warnings-only | mail -s "RKhunter Scan Results - $(hostname)" admin@1001stories.org
EOF
    
    chmod +x /etc/cron.weekly/rkhunter-check
    
    log "${GREEN}✓ Integrity checking configured${NC}"
}

# 사용자 계정 보안 강화
harden_user_accounts() {
    log "${YELLOW}Hardening user account security...${NC}"
    
    # 패스워드 정책 설정
    cat > /etc/security/pwquality.conf << 'EOF'
# 패스워드 품질 설정
minlen = 12
minclass = 3
maxrepeat = 3
maxclassgap = 4
enforcing = 1
EOF

    # 계정 잠금 정책 설정
    cat > /etc/security/faillock.conf << 'EOF'
# 계정 잠금 정책
deny = 5
fail_interval = 900
unlock_time = 600
audit
silent
EOF

    # 세션 타임아웃 설정
    cat > /etc/profile.d/session-timeout.sh << 'EOF'
# 세션 타임아웃 (30분)
TMOUT=1800
readonly TMOUT
export TMOUT
EOF
    
    chmod +x /etc/profile.d/session-timeout.sh
    
    # 불필요한 계정 잠금
    for user in games news uucp proxy www-data backup list irc gnats nobody; do
        if id "$user" &>/dev/null; then
            usermod -L "$user"
        fi
    done
    
    log "${GREEN}✓ User account security hardened${NC}"
}

# 시스템 정보 은닉
hide_system_info() {
    log "${YELLOW}Hiding system information...${NC}"
    
    # 시스템 정보 파일들 권한 변경
    chmod 600 /etc/passwd- /etc/group- /etc/shadow- /etc/gshadow-
    
    # 배너 파일 제거/수정
    > /etc/issue
    > /etc/issue.net
    > /etc/motd
    
    # 커널 버전 정보 숨기기
    echo "1001 Stories Production Server" > /etc/issue
    echo "Authorized users only" >> /etc/issue
    
    log "${GREEN}✓ System information hidden${NC}"
}

# Docker 보안 설정
secure_docker() {
    log "${YELLOW}Securing Docker installation...${NC}"
    
    # Docker 데몬 보안 설정
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
    "icc": false,
    "userns-remap": "default",
    "no-new-privileges": true,
    "selinux-enabled": false,
    "disable-legacy-registry": true,
    "live-restore": true,
    "userland-proxy": false,
    "experimental": false,
    "metrics-addr": "127.0.0.1:9323",
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

    # Docker 서비스 재시작
    systemctl restart docker
    
    log "${GREEN}✓ Docker security configured${NC}"
}

# 메인 실행 함수
main() {
    log "${BLUE}========================================${NC}"
    log "${BLUE}   1001 Stories Security Hardening      ${NC}"
    log "${BLUE}========================================${NC}"
    
    # 루트 권한 확인
    if [[ $EUID -ne 0 ]]; then
        log "${RED}This script must be run as root${NC}"
        exit 1
    fi
    
    # 백업 디렉토리 생성
    mkdir -p /root/security-backup/$(date +%Y%m%d)
    
    # 보안 강화 단계별 실행
    install_security_packages
    configure_firewall
    configure_fail2ban
    harden_ssh
    configure_auto_updates
    configure_auditing
    configure_log_monitoring
    configure_kernel_hardening
    configure_apparmor
    configure_integrity_checking
    harden_user_accounts
    hide_system_info
    secure_docker
    
    # 최종 시스템 상태 확인
    log "${YELLOW}Performing final security checks...${NC}"
    
    # Lynis 보안 감사 실행
    lynis audit system --quiet --no-log > /tmp/lynis-audit.txt
    
    # 보안 강화 완료 리포트
    log "${GREEN}========================================${NC}"
    log "${GREEN}   Security Hardening Completed!       ${NC}"
    log "${GREEN}========================================${NC}"
    
    echo -e "\n${YELLOW}Security Hardening Summary:${NC}"
    echo "✓ Firewall configured with UFW"
    echo "✓ Fail2Ban intrusion prevention active"
    echo "✓ SSH hardened and secured"
    echo "✓ Automatic security updates enabled"
    echo "✓ System auditing with auditd configured"
    echo "✓ Log monitoring with logwatch active"
    echo "✓ Kernel security parameters optimized"
    echo "✓ AppArmor security profiles enabled"
    echo "✓ File integrity monitoring with AIDE"
    echo "✓ User account security hardened"
    echo "✓ System information properly hidden"
    echo "✓ Docker security settings applied"
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Review and customize /etc/fail2ban/jail.local"
    echo "2. Add your admin IP to SSH allowlist"
    echo "3. Configure email settings for alerts"
    echo "4. Review Lynis audit results: /tmp/lynis-audit.txt"
    echo "5. Test all services after reboot"
    
    echo -e "\n${RED}Important: System reboot recommended${NC}"
}

# 스크립트 실행
main "$@"