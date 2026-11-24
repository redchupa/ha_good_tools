#!/usr/bin/with-contenv bashio

LOG_LEVEL=$(bashio::config 'log_level' 'info')
ALLOW_NETWORK_TOOLS=$(bashio::config 'allow_network_tools' 'true')
DEFAULT_THEME=$(bashio::config 'default_theme' 'system')

export PORT=8099
export HOST="0.0.0.0"
export PUBLIC_DIR="/app/public"
export DATA_DIR="/data"
export LOG_LEVEL="${LOG_LEVEL}"
export ALLOW_NETWORK_TOOLS="${ALLOW_NETWORK_TOOLS}"
export DEFAULT_THEME="${DEFAULT_THEME}"
export APP_VERSION="1.0.2"

bashio::log.info "Starting Good Tools v${APP_VERSION}..."
bashio::log.info "  Log level: ${LOG_LEVEL}"
bashio::log.info "  Network proxy tools enabled: ${ALLOW_NETWORK_TOOLS}"
bashio::log.info "  Default theme: ${DEFAULT_THEME}"

exec node /app/server/index.mjs
