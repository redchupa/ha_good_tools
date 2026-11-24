#!/usr/bin/with-contenv bashio

LOG_LEVEL=$(bashio::config 'log_level' 'info')
ALLOW_NETWORK_TOOLS=$(bashio::config 'allow_network_tools' 'true')
ALLOW_LAN_TOOLS=$(bashio::config 'allow_lan_tools' 'false')
DEFAULT_THEME=$(bashio::config 'default_theme' 'system')

export HA_USER_IDS="$(bashio::config 'ha_user_ids')"
export ALLOW_TEMPLATE_EVAL="$(bashio::config 'allow_template_eval')"
export HA_NOTIFY_SERVICE="$(bashio::config 'notify_service')"
export INGRESS_ONLY=true
export PORT=8099
export HOST="0.0.0.0"
export PUBLIC_DIR="/app/public"
export DATA_DIR="/data"
export LOG_LEVEL="${LOG_LEVEL}"
export ALLOW_NETWORK_TOOLS="${ALLOW_NETWORK_TOOLS}"
export ALLOW_LAN_TOOLS="${ALLOW_LAN_TOOLS}"
export DEFAULT_THEME="${DEFAULT_THEME}"
export APP_VERSION="1.5.0"

bashio::log.info "Starting Good Tools v${APP_VERSION}..."
bashio::log.info "  Log level: ${LOG_LEVEL}"
bashio::log.info "  Network proxy tools enabled: ${ALLOW_NETWORK_TOOLS}"
bashio::log.info "  LAN tools (WoL/Port Check) enabled: ${ALLOW_LAN_TOOLS}"
bashio::log.info "  Default theme: ${DEFAULT_THEME}"

exec node /app/server/index.mjs
