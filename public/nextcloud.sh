#!/bin/bash
# ============================================================================
#  Perfect Nextcloud Installer - Arch Linux Edition
#  Original author: Ze'ev Schurmann (GPL 3.0 or later)
#  Arch port: community rewrite
#  Uses official Arch nextcloud package for latest stable release.
# ============================================================================
INSTALLERVERSION="1.05.02-arch"

if [[ $(whoami) != "root" ]]; then
  echo "You must be root to run this script!"
  exit 1
fi

oldpath=$(pwd)
LOGFILE="$oldpath/installer-errors.log"

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
function decho {
  echo "$@"
  echo "$@" >> "$LOGFILE"
}

function failMsg {
  echo "ERROR: $1" >&2
  echo "ERROR: $1 [runtime ${SECONDS}s]" >> "$LOGFILE"
  echo $((SECONDS+runtime)) > "$oldpath/runtime.temp"
  exit 1
}

function showTimer {
  printf "%02d:%02d:%02d\n" $((${1}/3600)) $((${1}%3600/60)) $((${1}%60))
}

function compareVersions {
  if [[ -z "$1" || -z "$2" ]]; then
    echo "Failed to compare versions..." >&2
    return 1
  fi
  IFS='.' read -ra vold <<< "$1"
  IFS='.' read -ra vnew <<< "$2"
  for ((n=0;n<${#vnew[@]};n++)); do vnew[$n]=$((10#${vnew[$n]})); done
  for ((n=0;n<${#vold[@]};n++)); do vold[$n]=$((10#${vold[$n]})); done
  while [[ ${#vold[@]} -lt ${#vnew[@]} ]]; do vold+=(0); done
  while [[ ${#vnew[@]} -lt ${#vold[@]} ]]; do vnew+=(0); done
  for ((n=0;n<${#vnew[@]};n++)); do
    if (( vnew[n] > vold[n] )); then return 0; fi
    if (( vnew[n] < vold[n] )); then return 1; fi
  done
  return 1
}

# Install only packages that actually exist in official repos
function pacInstall {
  local pkgs=() p
  for p in "$@"; do
    if pacman -Si "$p" &>/dev/null; then
      pkgs+=("$p")
    else
      echo "Package '$p' not in official repos, skipping." >> "$LOGFILE"
    fi
  done
  if [[ ${#pkgs[@]} -gt 0 ]]; then
    pacman -S --noconfirm --needed "${pkgs[@]}" >> "$LOGFILE" 2>&1 || return 1
  fi
  return 0
}

# Enable an Apache module by uncommenting / adding its LoadModule line
function a2enmod {
  local mod="$1"
  local conf="/etc/httpd/conf/httpd.conf"
  local so="/usr/lib/httpd/modules/mod_${mod}.so"
  if grep -qE "^[[:space:]]*LoadModule[[:space:]]+${mod}_module" "$conf"; then
    return 0
  fi
  if grep -qE "^[[:space:]]*#[[:space:]]*LoadModule[[:space:]]+${mod}_module" "$conf"; then
    sed -i -E "s|^[[:space:]]*#[[:space:]]*LoadModule[[:space:]]+(${mod}_module.*)$|LoadModule \1|" "$conf"
    return 0
  fi
  if [[ -f "$so" ]]; then
    echo "LoadModule ${mod}_module modules/mod_${mod}.so" >> "$conf"
    return 0
  fi
  return 1
}

# ----------------------------------------------------------------------------
# genPass (unchanged)
# ----------------------------------------------------------------------------
function genPass {
  if [[ -z $1 ]] || [[ $1 == "" ]]; then
    failMsg "Function genPass requires an integer between 12 and 64"
  fi
  local LAST3CHAR=(- - -) LAST3SET=(9 9 9)
  local LCHARSET=(x y z a b c d e f g h i j k l m n o p q r s t u v w x y z a b c)
  local NCHARSET=(7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2)
  local STRING=""
  local UCHARSET=(X Y Z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z A B C)
  local i n newset safe
  if [[ $1 -ge 8 ]] && [[ $1 -le 64 ]]; then
    for ((n=0;n<$1;n++)); do
      safe=false
      while [[ $safe == false ]]; do
        newset=$((RANDOM%3))
        if [[ $newset != ${LAST3SET[0]} ]] || [[ $newset != ${LAST3SET[1]} ]] || [[ $newset != ${LAST3SET[2]} ]]; then
          LAST3SET[2]=${LAST3SET[1]}; LAST3SET[1]=${LAST3SET[0]}; LAST3SET[0]=$newset; safe=true
        fi
      done
      safe=false
      while [[ $safe == false ]]; do
        if [[ $newset == 2 ]]; then
          i=$(((RANDOM%10)+3))
          if [[ ${NCHARSET[$i]} != ${LAST3CHAR[0]} ]] && [[ ${NCHARSET[$i]} != ${LAST3CHAR[1]} ]] && [[ ${NCHARSET[$i]} != ${LAST3CHAR[2]} ]]; then
            LAST3CHAR[2]=${LAST3CHAR[1]}; LAST3CHAR[1]=${LAST3CHAR[0]}; LAST3CHAR[0]=${NCHARSET[$i]}
            STRING="${STRING}${NCHARSET[$i]}"; safe=true
          fi
        else
          i=$(((RANDOM%26)+3))
          if [[ ${UCHARSET[$i]} != ${LAST3CHAR[0]} ]] && [[ ${UCHARSET[$i]} != ${LAST3CHAR[1]} ]] && [[ ${LCHARSET[$i]} != ${LAST3CHAR[0]} ]]; then
            LAST3CHAR[2]=${LAST3CHAR[1]}; LAST3CHAR[1]=${LAST3CHAR[0]}
            if [[ $newset == 1 ]]; then
              LAST3CHAR[0]=${LCHARSET[$i]}; STRING="${STRING}${LCHARSET[$i]}"
            else
              LAST3CHAR[0]=${UCHARSET[$i]}; STRING="${STRING}${UCHARSET[$i]}"
            fi
            safe=true
          fi
        fi
      done
    done
    echo -n $STRING
  else
    failMsg "Function genPass requires an integer between 12 and 64"
  fi
}

# ----------------------------------------------------------------------------
# MariaDB (Arch: root auth via unix_socket)
# ----------------------------------------------------------------------------
function doMariaDB {
  mysql -u root <<SQL >> "$LOGFILE" 2>&1 || return 1
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DBROOTPASS}';
DELETE FROM mysql.global_priv WHERE User='';
DELETE FROM mysql.global_priv WHERE User='root' AND Host NOT IN ('localhost','127.0.0.1','::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
SQL
  return 0
}

# ----------------------------------------------------------------------------
# PHP-FPM configuration (Arch: uses php-legacy-fpm, nextcloud user)
# ----------------------------------------------------------------------------
function doPHP {
  # Apache: use event MPM + proxy_fcgi
  a2enmod mpm_event || true
  a2enmod proxy
  a2enmod proxy_fcgi
  a2enmod setenvif
  a2enmod rewrite
  a2enmod headers
  a2enmod env
  a2enmod dir
  a2enmod mime
  a2enmod ssl
  a2enmod dav
  a2enmod dav_fs

  # Ensure PHP-FPM pool for Nextcloud uses the nextcloud user and a socket
  # Arch's php-legacy-fpm provides a default www.conf; we create a Nextcloud-specific pool
  local poolconf="/etc/php-legacy/php-fpm.d/nextcloud.conf"
  mkdir -p /etc/php-legacy/php-fpm.d
  cat > "$poolconf" <<EOF
[nextcloud]
user = nextcloud
group = nextcloud
listen = /run/php-fpm/nextcloud.sock
listen.owner = nextcloud
listen.group = nextcloud
listen.mode = 0660
pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 6
php_admin_value[open_basedir] = /var/lib/nextcloud:/tmp:/usr/share/webapps/nextcloud:/etc/webapps/nextcloud:/dev/urandom:/usr/lib/php-legacy/modules:/var/log/nextcloud:/proc/meminfo:/proc/cpuinfo
EOF

  # Custom Nextcloud PHP settings in dedicated ini
  local ncphpini="/etc/webapps/nextcloud/php.ini"
  # Nextcloud package already provides a base copy; append our settings
  cat >> "$ncphpini" <<EOF

;;;;;;;;;;;;;;;;;;;
; Resource Limits ;
;;;;;;;;;;;;;;;;;;;
max_execution_time = 240
memory_limit = 512M

;;;;;;;;;;;;;;;;;
; Data Handling ;
;;;;;;;;;;;;;;;;;
post_max_size = 512M

;;;;;;;;;;;;;;;;
; File Uploads ;
;;;;;;;;;;;;;;;;
upload_max_filesize = 2048M

;;;;;;;;;;;;;;;;;;;
; Module Settings ;
;;;;;;;;;;;;;;;;;;;
[Date]
date.timezone = $PHPTIMEZONE

[opcache]
opcache.enable=1
opcache.memory_consumption=1024
opcache.interned_strings_buffer=128
opcache.max_accelerated_files=50000
opcache.validate_timestamps=0
opcache.revalidate_freq=60
opcache.save_comments=1
EOF

  systemctl enable php-legacy-fpm.service >> "$LOGFILE" 2>&1
  systemctl restart php-legacy-fpm.service >> "$LOGFILE" 2>&1 || failMsg "php-legacy-fpm failed to start..."
  systemctl restart httpd.service  >> "$LOGFILE" 2>&1 || failMsg "httpd failed to restart after PHP config..."
}

# ----------------------------------------------------------------------------
# Timezone selection (Arch uses systemd timedatectl)
# ----------------------------------------------------------------------------
function doTimezoneSelect {
  local regions=("Africa" "America" "Antarctica" "Arctic" "Asia" "Atlantic" "Australia" "Europe" "Indian" "Pacific")
  while true; do
    echo "Please select a Region for your timezone (or press ENTER to quit):"
    local i=0
    for r in "${regions[@]}"; do echo "  $i. $r"; ((i++)); done
    read input
    if [[ -z "$input" ]]; then
      return 1
    fi
    if ! [[ "$input" =~ ^[0-9]+$ ]] || [[ -z "${regions[$input]}" ]]; then
      continue
    fi
    local region="${regions[$input]}"
    mapfile -t zones < <(timedatectl list-timezones | grep "^${region}/")
    local page=0
    local total=${#zones[@]}
    local perpage=10
    while true; do
      echo "Timezones in $region (page $((page+1))):"
      local start=$((page*perpage))
      local end=$((start+perpage))
      [[ $end -gt $total ]] && end=$total
      for ((n=start;n<end;n++)); do
        echo "  $((n-start)). ${zones[$n]}"
      done
      [[ $end -lt $total ]] && echo "  N. Next page"
      [[ $page -gt 0 ]] && echo "  P. Previous page"
      echo "Enter digit, N, P, or ENTER to go back:"
      read sel
      sel="${sel:0:1}"
      if [[ "$sel" =~ ^[0-9]$ ]]; then
        local pick=$((start+sel))
        if [[ -n "${zones[$pick]}" ]]; then
          PHPTIMEZONE="${zones[$pick]}"
          return 0
        fi
      elif [[ "${sel^^}" == "N" ]] && [[ $end -lt $total ]]; then
        ((page++))
      elif [[ "${sel^^}" == "P" ]] && [[ $page -gt 0 ]]; then
        ((page--))
      else
        break
      fi
    done
  done
}

# ----------------------------------------------------------------------------
# coTURN
# ----------------------------------------------------------------------------
function doTURN {
  cat >> /etc/turnserver.conf <<EOF

###############################
# Custom Config for Nextcloud #
###############################
listening-port=3478
tls-listening-port=5349
alt-listening-port=0
alt-tls-listening-port=0
min-port=60000
max-port=61999
fingerprint
use-auth-secret
static-auth-secret=$TURNPASS
realm=$FQDN
total-quota=0
bps-capacity=0
no-multicast-peers
EOF
  systemctl enable coturn.service >> "$LOGFILE" 2>&1
  systemctl restart coturn.service >> "$LOGFILE" 2>&1 || failMsg "coTURN failed to restart with new settings..."
}

# ----------------------------------------------------------------------------
# Apache vhosts (Arch httpd)
# ----------------------------------------------------------------------------
function doVHost {
  mkdir -p /etc/httpd/conf/extra
  local conf="/etc/httpd/conf/extra/nextcloud-${NCWWW}.conf"

  if [[ -f "$conf" ]]; then
    echo "VHost file already exists..."
    echo -n "Press ENTER to view, type GO to replace: "
    read input
    if [[ "${input:0:2}" != "GO" ]]; then
      cat "$conf"
      echo "Type GO to replace or press ENTER to abort."
      read input
      [[ "${input:0:2}" != "GO" ]] && exit 0
    fi
    rm -f "$conf"
  fi

  # Ensure directories exist with correct ownership
  mkdir -p "/var/www/${NCWWW}"
  chown -R nextcloud:nextcloud "/var/www/${NCWWW}"

  # HTTP vhost (challenge + redirect)
  cat > "$conf" <<EOF
<VirtualHost *:80>
    ServerName $FQDN
    ServerAdmin $EMAIL
    DocumentRoot /var/www/${NCWWW}/

    ErrorLog  /var/log/httpd/${NCWWW}-error.log
    CustomLog /var/log/httpd/${NCWWW}-access.log combined

    # Let's Encrypt ACME challenge
    Alias /.well-known/acme-challenge/ /var/www/${NCWWW}/.well-known/acme-challenge/
    <Directory "/var/www/${NCWWW}/.well-known/acme-challenge/">
        Require all granted
        Options None
        AllowOverride None
    </Directory>

    <Directory /var/www/${NCWWW}/>
        Require all granted
        AllowOverride All
        Options FollowSymLinks MultiViews
        <IfModule mod_dav.c>
            Dav off
        </IfModule>
    </Directory>

    <FilesMatch \.php\$>
        SetHandler "proxy:unix:/run/php-fpm/nextcloud.sock|fcgi://localhost/"
    </FilesMatch>

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
EOF

  # Make sure httpd.conf loads our extra file
  if ! grep -q "conf/extra/nextcloud-\*.conf" /etc/httpd/conf/httpd.conf; then
    echo 'IncludeOptional conf/extra/nextcloud-*.conf' >> /etc/httpd/conf/httpd.conf
  fi

  systemctl restart httpd.service >> "$LOGFILE" 2>&1 || failMsg "httpd failed to restart after vhost..."
}

# ----------------------------------------------------------------------------
# AutoSWAP (external tool, same as original)
# ----------------------------------------------------------------------------
function doSWAP {
  wget "https://git.zaks.web.za/thisiszeev/linux-server-tools/releases/download/autoswap-v1.01.01/autoswap-v1.01.01.zip" -O autoswap.zip >> "$LOGFILE" 2>&1 || failMsg "Failed to download Auto SWAP..."
  mkdir -p autoswap
  unzip -o autoswap.zip -d ./autoswap >> "$LOGFILE" 2>&1
  mkdir -p /etc/autoswap
  mv ./autoswap/autoswap.conf /etc/autoswap/autoswap.conf
  mv ./autoswap/autoswap.sh  /autoswap.sh && chmod +x /autoswap.sh
  mv ./autoswap/addswap.sh   /addswap.sh  && chmod +x /addswap.sh
  mv ./autoswap/remswap.sh   /remswap.sh  && chmod +x /remswap.sh
  mv ./autoswap/README.md    /etc/autoswap/README.md
  mv ./autoswap/LICENSE      /etc/autoswap/LICENSE
  mv ./autoswap/autoswap.service /etc/systemd/system/autoswap.service
  rm -rf ./autoswap autoswap.zip
  systemctl daemon-reload
  systemctl start autoswap.service >> "$LOGFILE" 2>&1 || failMsg "Auto SWAP service failed to start..."
  systemctl enable autoswap.service >> "$LOGFILE" 2>&1 || failMsg "Auto SWAP service could not be enabled..."
}

# ----------------------------------------------------------------------------
# Installation report
# ----------------------------------------------------------------------------
function doREPORT {
  TODAY="$(date "+%Y-%m-%d")"
  R="NEXTCLOUD-REPORT-$TODAY.md"
  {
    echo "# NEXTCLOUD INSTALLATION REPORT"
    echo
    echo "**Install Date:** $(date "+%B %-d, %Y")"
    echo "**Installer Version:** $INSTALLERVERSION (Arch port)"
    echo "**Installer Author (original):** Ze'ev Schurmann"
    echo "**Installer License:** GPL 3.0 or later"
    echo "**Installer Website:** https://git.zaks.web.za/thisiszeev/perfect-nextcloud-installer"
    echo
    echo "## Logging onto Nextcloud"
    echo
    echo "Open your browser to https://$FQDN"
    echo
    echo "**Admin Username:** $NCADMIN"
    echo "**Admin Password:** $NCPASS"
    echo
    echo "## Setting up Talk App to use coTURN"
    echo
    echo "1. Install the Talk App, then go to Admin Settings → Talk."
    echo "2. Add a TURN server."
    echo "3. Use both turn: and turns:."
    echo "4. Server URL: $FQDN"
    echo "5. Secret: $TURNPASS"
    echo "6. Enable both UDP and TCP."
    echo
    echo "Forward these ports on your router if behind NAT:"
    echo "- 80, 443 (TCP)"
    echo "- 3478, 3479, 5349, 5350 (TCP & UDP)"
    echo "- 60000–61999 (TCP & UDP)"
    echo
    echo "## MariaDB / MySQL"
    echo "**Server:** $DBHOST"
    echo "**Database:** $DBNAME"
    echo "**Username:** $DBUSER"
    echo "**Password:** $DBPASS"
    [[ "$DBHOST" == "localhost" ]] && echo "**Root Password:** $DBROOTPASS"
    echo
    echo "## Apache"
    echo "**Version:** $(httpd -v 2>/dev/null | head -1)"
    echo "**VHost (http):** /etc/httpd/conf/extra/nextcloud-${NCWWW}.conf"
    echo "**VHost (https):** /etc/httpd/conf/extra/nextcloud-${NCWWW}-ssl.conf"
    echo "**Webroot:** /var/www/${NCWWW}/"
    echo "**Data dir:** /var/lib/nextcloud/data/"
    echo
    echo "## PHP"
    echo "**Version:** $(php-legacy -v | head -1)"
    echo "**Modules:** $(php-legacy -m | paste -sd, - | sed 's/,/, /g')"
  } > "$R"
  echo
  echo "Your installation report is saved as $R"
}

# ----------------------------------------------------------------------------
# Self-update (disabled on Arch port)
# ----------------------------------------------------------------------------
function downloadUpdate {
  echo "Self-update skipped (Arch port)." >> "$LOGFILE"
}

# ============================================================================
# MAIN
# ============================================================================
declare DBHOST DBNAME DBPASS DBROOTPASS DBUSER EMAIL FQDN \
        NCADMIN NCFILES NCPASS NCWWW PHPTIMEZONE TURNPASS AUTOSWAP

echo "Welcome to the Perfect Nextcloud Installer (Arch Edition) $INSTALLERVERSION"
echo

if [[ ! -f /etc/arch-release ]]; then
  echo "WARNING: This does not look like Arch Linux. Continue at your own risk."
  echo -n "Press ENTER to continue or CTRL+C to abort: "
  read _
fi

if [[ ! -f settings.conf ]]; then
  CPUCOUNT=$(grep -c "^processor" /proc/cpuinfo)
  temp=($(grep "^MemTotal" /proc/meminfo))
  SYSTEMRAM=$((temp[1]/1000000))
  echo "Detected CPUs: $CPUCOUNT   RAM: ${SYSTEMRAM} GB"
  [[ $CPUCOUNT -lt 4 || $SYSTEMRAM -lt 8 ]] && echo "Below recommended (4 CPU / 8 GB). Performance may be poor."

  echo -n "Fully qualified domain name (no http://): "
  read FQDN
  echo -n "Email address (SSL + admin): "
  read EMAIL
  doTimezoneSelect
  echo -n "Install AutoSWAP? [ENTER=Yes / NO]: "
  read input
  if [[ "${input:0:1}" == "N" || "${input:0:1}" == "n" ]]; then AUTOSWAP="false"; else AUTOSWAP="true"; fi

  cat > settings.conf <<EOF
DBHOST="localhost"
DBNAME="nextcloud"
DBPASS="$(genPass 24)"
DBROOTPASS="$(genPass 32)"
DBUSER="nextcloud"
EMAIL="$EMAIL"
FQDN="$FQDN"
NCADMIN="ncadmin"
NCFILES="nextcloudfiles"
NCPASS="$(genPass 24)"
NCWWW="nextcloud"
TURNPASS="$(genPass 64)"
PHPTIMEZONE="$PHPTIMEZONE"
AUTOSWAP="$AUTOSWAP"
EOF
  echo "Wrote settings.conf"
else
  echo "Using existing settings.conf"
fi

source settings.conf

echo
echo "Installing with:"
echo "  FQDN:        https://$FQDN"
echo "  DB:          $DBUSER@$DBHOST/$DBNAME"
echo "  Admin:       $NCADMIN"
echo "  Webroot:     /var/www/$NCWWW"
echo "  Files dir:   /var/lib/nextcloud/data"
echo "  Timezone:    $PHPTIMEZONE"
echo "  AutoSWAP:    $AUTOSWAP"
echo "Press ENTER to continue..."
read _

[[ -f runtime.temp ]] && runtime=$(head -1 runtime.temp) || runtime=0
[[ ! -f position.temp ]] && echo "1" > position.temp

SECONDS=0
p=$(head -1 position.temp)

# ---------- Step 1: system update ----------
decho "[Step 1] Updating system... [$(showTimer $SECONDS)]"
pacman -Syu --noconfirm >> "$LOGFILE" 2>&1 || failMsg "pacman failed to update the system..."

# ---------- Step 2: tools ----------
if [[ $p -lt 2 ]]; then
  decho "[Step 2] Installing base tools... [$(showTimer $SECONDS)]"
  pacInstall base-devel sudo wget curl rsync screen unzip jq cronie nano vim git || failMsg "Failed to install tools..."
  systemctl enable cronie.service >> "$LOGFILE" 2>&1
  systemctl start  cronie.service >> "$LOGFILE" 2>&1
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 3: self-update ----------
if [[ $p -lt 3 ]]; then
  decho "[Step 3] Skipping self-update on Arch port... [$(showTimer $SECONDS)]"
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 4: Apache + certbot ----------
if [[ $p -lt 4 ]]; then
  decho "[Step 4] Installing Apache httpd and Certbot... [$(showTimer $SECONDS)]"
  pacInstall httpd certbot certbot-apache openssl || failMsg "Failed to install Apache/Certbot..."
  systemctl enable httpd.service >> "$LOGFILE" 2>&1
  systemctl start  httpd.service >> "$LOGFILE" 2>&1 || failMsg "httpd failed to start..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 5: HTTP/HTTPS online test skipped ----------
if [[ $p -lt 5 ]]; then
  decho "[Step 5] Skipping HTTP/HTTPS API test (disabled upstream). [$(showTimer $SECONDS)]"
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 6: vhost ----------
if [[ $p -lt 6 ]]; then
  decho "[Step 6] Configuring Apache vhost... [$(showTimer $SECONDS)]"
  doVHost || failMsg "Apache vhost config failed..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 7: FQDN check skipped ----------
if [[ $p -lt 7 ]]; then
  decho "[Step 7] Skipping FQDN resolution test (disabled upstream). [$(showTimer $SECONDS)]"
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 8: SSL certificate ----------
if [[ $p -lt 8 ]]; then
  decho "[Step 8] Requesting SSL certificate from Let's Encrypt... [$(showTimer $SECONDS)]"
  mkdir -p "/var/www/${NCWWW}/.well-known/acme-challenge"
  chown -R nextcloud:nextcloud "/var/www/${NCWWW}"
  systemctl restart httpd.service >> "$LOGFILE" 2>&1
  certbot certonly --webroot -w "/var/www/${NCWWW}" -d "$FQDN" \
      -m "$EMAIL" --agree-tos -n >> "$LOGFILE" 2>&1 \
      || failMsg "Certbot failed to obtain certificate for $FQDN..."

  # Build SSL vhost now that cert exists
  cat > "/etc/httpd/conf/extra/nextcloud-${NCWWW}-ssl.conf" <<EOF
<VirtualHost *:443>
    ServerName $FQDN
    ServerAdmin $EMAIL
    DocumentRoot /var/www/${NCWWW}/

    ErrorLog  /var/log/httpd/${NCWWW}-ssl-error.log
    CustomLog /var/log/httpd/${NCWWW}-ssl-access.log combined

    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/$FQDN/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/$FQDN/privkey.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite HIGH:!aNULL:!MD5

    <Directory /var/www/${NCWWW}/>
        Require all granted
        AllowOverride All
        Options FollowSymLinks MultiViews
        <IfModule mod_dav.c>
            Dav off
        </IfModule>
    </Directory>

    <FilesMatch \.php\$>
        SetHandler "proxy:unix:/run/php-fpm/nextcloud.sock|fcgi://localhost/"
    </FilesMatch>

    <IfModule mod_headers.c>
        Header always set Strict-Transport-Security "max-age=15552000; includeSubDomains"
        Header always set Referrer-Policy "no-referrer"
    </IfModule>
</VirtualHost>
EOF
  systemctl restart httpd.service >> "$LOGFILE" 2>&1 || failMsg "httpd failed after SSL vhost..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 9: MariaDB ----------
if [[ $p -lt 9 ]]; then
  if [[ "$DBHOST" == "localhost" ]]; then
    decho "[Step 9] Installing MariaDB... [$(showTimer $SECONDS)]"
    pacInstall mariadb mariadb-clients || failMsg "Failed to install MariaDB..."
    mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql >> "$LOGFILE" 2>&1 || true
    systemctl enable mariadb.service >> "$LOGFILE" 2>&1
    systemctl start  mariadb.service >> "$LOGFILE" 2>&1 || failMsg "MariaDB failed to start..."
    sleep 3
  else
    decho "[Step 9] Remote DB configured; skipping local MariaDB install. [$(showTimer $SECONDS)]"
  fi
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 10: secure MariaDB ----------
if [[ $p -lt 10 ]]; then
  if [[ "$DBHOST" == "localhost" ]]; then
    decho "[Step 10] Securing MariaDB... [$(showTimer $SECONDS)]"
    doMariaDB || failMsg "Securing MariaDB failed..."
  else
    decho "[Step 10] Skipping local MariaDB hardening. [$(showTimer $SECONDS)]"
  fi
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 11: create DB ----------
if [[ $p -lt 11 ]]; then
  if [[ "$DBHOST" == "localhost" ]]; then
    decho "[Step 11] Creating Nextcloud database... [$(showTimer $SECONDS)]"
    mysql -u root -p"$DBROOTPASS" <<SQL >> "$LOGFILE" 2>&1 || failMsg "Failed to create DB..."
CREATE DATABASE IF NOT EXISTS $DBNAME CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '$DBUSER'@'localhost' IDENTIFIED BY '$DBPASS';
GRANT ALL PRIVILEGES ON $DBNAME.* TO '$DBUSER'@'localhost';
FLUSH PRIVILEGES;
SQL
  else
    decho "[Step 11] Skipping local DB creation. [$(showTimer $SECONDS)]"
  fi
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 12: no Sury repo on Arch ----------
if [[ $p -lt 12 ]]; then
  decho "[Step 12] PHP is native on Arch; skipping extra repos. [$(showTimer $SECONDS)]"
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 13: PHP (php-legacy from nextcloud package) ----------
if [[ $p -lt 13 ]]; then
  decho "[Step 13] Installing PHP (php-legacy) and extensions... [$(showTimer $SECONDS)]"
  # nextcloud package pulls in php-legacy and most required extensions
  pacInstall nextcloud php-legacy-fpm php-legacy-sodium php-legacy-imagick librsvg \
             php-legacy-gd php-legacy-intl php-legacy-apcu php-legacy-redis \
             php-legacy-memcached php-legacy-bcmath php-legacy-gmp \
             php-legacy-exif php-legacy-ldap php-legacy-pgsql php-legacy-sqlite \
             libxml2 libxslt icu >> "$LOGFILE" 2>&1 \
    || failMsg "Failed to install PHP/nextcloud packages..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 14: PHP config ----------
if [[ $p -lt 14 ]]; then
  decho "[Step 14] Writing Nextcloud PHP config... [$(showTimer $SECONDS)]"
  doPHP || failMsg "PHP config failed..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 15: coturn ----------
if [[ $p -lt 15 ]]; then
  decho "[Step 15] Installing coTURN... [$(showTimer $SECONDS)]"
  pacInstall coturn || failMsg "Failed to install coTURN..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 16: configure coturn ----------
if [[ $p -lt 16 ]]; then
  decho "[Step 16] Configuring coTURN... [$(showTimer $SECONDS)]"
  doTURN || failMsg "coTURN config failed..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 17: Redis + memcached ----------
if [[ $p -lt 17 ]]; then
  decho "[Step 17] Installing Redis and Memcached... [$(showTimer $SECONDS)]"
  pacInstall redis memcached || failMsg "Failed to install Redis/memcached..."
  systemctl enable --now redis.service     >> "$LOGFILE" 2>&1 || failMsg "Redis failed to start..."
  systemctl enable --now memcached.service >> "$LOGFILE" 2>&1 || failMsg "Memcached failed to start..."
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 18: ImageMagick SVG ----------
if [[ $p -lt 18 ]]; then
  decho "[Step 18] Enabling ImageMagick SVG support... [$(showTimer $SECONDS)]"
  pacInstall librsvg imagemagick >> "$LOGFILE" 2>&1 || true
  if [[ -f /etc/ImageMagick-7/policy.xml ]]; then
    sed -i 's|<policy domain="coder" rights="none" pattern="SVG" />|<policy domain="coder" rights="read\|write" pattern="SVG" />|' /etc/ImageMagick-7/policy.xml
  elif [[ -f /etc/ImageMagick-6/policy.xml ]]; then
    sed -i 's|</policymap>|  <policy domain="coder" rights="read\|write" pattern="SVG" />\n</policymap>|' /etc/ImageMagick-6/policy.xml
  fi
  systemctl restart httpd.service >> "$LOGFILE" 2>&1
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 19: AutoSWAP ----------
if [[ $p -lt 19 ]]; then
  if [[ "$AUTOSWAP" == "true" ]]; then
    decho "[Step 19] Installing AutoSWAP... [$(showTimer $SECONDS)]"
    doSWAP || failMsg "AutoSWAP failed..."
  else
    decho "[Step 19] AutoSWAP disabled. [$(showTimer $SECONDS)]"
  fi
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 20: (removed) download Nextcloud ----------
if [[ $p -lt 20 ]]; then
  decho "[Step 20] Nextcloud package already installed; skipping manual download. [$(showTimer $SECONDS)]"
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 21: install Nextcloud via occ ----------
if [[ $p -lt 21 ]]; then
  decho "[Step 21] Installing Nextcloud via occ... [$(showTimer $SECONDS)]"
  cd /usr/share/webapps/nextcloud
  # Use the nextcloud user and the dedicated PHP config
  sudo -u nextcloud env NEXTCLOUD_PHP_CONFIG=/etc/webapps/nextcloud/php.ini \
      php-legacy occ maintenance:install \
      --database="mysql" \
      --database-name="$DBNAME" \
      --database-host="$DBHOST" \
      --database-user="$DBUSER" \
      --database-pass="$DBPASS" \
      --admin-user="$NCADMIN" \
      --admin-pass="$NCPASS" \
      --admin-email="$EMAIL" \
      --data-dir="/var/lib/nextcloud/data" >> "$LOGFILE" 2>&1 \
      || failMsg "Nextcloud occ install failed..."

  sudo -u nextcloud env NEXTCLOUD_PHP_CONFIG=/etc/webapps/nextcloud/php.ini \
      php-legacy occ user:enable "$NCADMIN" >> "$LOGFILE" 2>&1
  sudo -u nextcloud env NEXTCLOUD_PHP_CONFIG=/etc/webapps/nextcloud/php.ini \
      php-legacy occ user:setting "$NCADMIN" settings email "$EMAIL" >> "$LOGFILE" 2>&1

  # Set trusted domains and other config
  occ_run() {
    sudo -u nextcloud env NEXTCLOUD_PHP_CONFIG=/etc/webapps/nextcloud/php.ini \
        php-legacy occ "$@"
  }
  occ_run config:system:set trusted_domains 0 --value="$FQDN"
  occ_run config:system:set trusted_domains 1 --value="localhost"
  occ_run config:system:set overwrite.cli.url --type=string --value="https://$FQDN"
  occ_run config:system:set maintenance_window_start --type=integer --value=1
  occ_run config:system:set debug --type=boolean --value=false
  occ_run config:system:set memcache.local       --type=string --value="\\OC\\Memcache\\APCu"
  occ_run config:system:set memcache.distributed --type=string --value="\\OC\\Memcache\\Redis"
  occ_run config:system:set memcache.locking     --type=string --value="\\OC\\Memcache\\Redis"
  occ_run config:system:set redis host    --type=string  --value=localhost
  occ_run config:system:set redis port    --type=integer --value=6379
  occ_run config:system:set redis timeout --type=float   --value=0.0

  # Use the systemd timer provided by the nextcloud package
  systemctl enable nextcloud-cron.timer >> "$LOGFILE" 2>&1
  systemctl start  nextcloud-cron.timer >> "$LOGFILE" 2>&1
  occ_run background:cron >> "$LOGFILE" 2>&1
  occ_run maintenance:repair --include-expensive >> "$LOGFILE" 2>&1

  # Create /usr/local/bin/occ wrapper
  cat > /usr/local/bin/occ <<'EOF'
#!/bin/bash
export NEXTCLOUD_PHP_CONFIG=/etc/webapps/nextcloud/php.ini
cd /usr/share/webapps/nextcloud
sudo -u nextcloud php-legacy occ "$@"
EOF
  chmod +x /usr/local/bin/occ

  cd "$oldpath"
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 22: cleanup ----------
if [[ $p -lt 22 ]]; then
  decho "[Step 22] Removing orphan packages... [$(showTimer $SECONDS)]"
  orphans=$(pacman -Qtdq 2>/dev/null || true)
  [[ -n "$orphans" ]] && pacman -Rns --noconfirm $orphans >> "$LOGFILE" 2>&1 || true
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 23: restart services ----------
if [[ $p -lt 23 ]]; then
  decho "[Step 23] Restarting services... [$(showTimer $SECONDS)]"
  for svc in memcached redis coturn mariadb php-legacy-fpm httpd cronie; do
    if systemctl list-unit-files "${svc}.service" &>/dev/null; then
      echo -n "$svc... "
      systemctl restart "${svc}.service" >> "$LOGFILE" 2>&1 && echo "OK" || echo "FAIL (see $LOGFILE)"
    fi
  done
  ((p++)); echo "$p" > position.temp
fi

# ---------- Step 24: report + finish ----------
if [[ $p -lt 24 ]]; then
  decho "[Step 24] Writing report and cleaning up... [$(showTimer $SECONDS)]"
  doREPORT
  cp NEXTCLOUD-REPORT*.md "/var/lib/nextcloud/data/${NCADMIN}/files/" 2>/dev/null || true
  sudo -u nextcloud env NEXTCLOUD_PHP_CONFIG=/etc/webapps/nextcloud/php.ini \
      php-legacy /usr/share/webapps/nextcloud/occ files:scan --all >> "$LOGFILE" 2>&1 || true

  mkdir -p /etc/nextcloud-installer
  {
    echo "# Created by Perfect Nextcloud Installer (Arch port)"
    echo "LASTINSTALLERVERSION=$INSTALLERVERSION"
    cat settings.conf
  } > /etc/nextcloud-installer/settings.conf

  rm -f position.temp settings.conf runtime.temp
  [[ -f "$LOGFILE" ]] && mv "$LOGFILE" "/etc/nextcloud-installer/installer-errors.$INSTALLERVERSION.log"

  echo
  echo "CONGRATULATIONS!"
  echo "Total runtime: $(showTimer $((runtime+SECONDS)))"
  echo
  echo "  URL:      https://$FQDN"
  echo "  Username: $NCADMIN"
  echo "  Password: $NCPASS"
  echo
  echo "First login may show 'session expired' — retry and it works."
  echo "The cron warning disappears after ~5 minutes."
  echo "A copy of the report was placed in ${NCADMIN}'s Files."
fi
