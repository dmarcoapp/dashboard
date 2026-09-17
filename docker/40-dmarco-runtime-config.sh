#!/bin/sh
# Writes the runtime configuration consumed by the dashboard before nginx starts.
# Executed automatically by the nginx entrypoint (/docker-entrypoint.d).
set -eu

CONFIG_FILE="${DMARCO_RUNTIME_CONFIG_FILE:-/usr/share/nginx/html/config.js}"

json_escape() {
    printf '%s' "$1" | tr -d '\n\r' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

json_bool() {
    case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
        1 | true | yes | on) printf 'true' ;;
        *) printf 'false' ;;
    esac
}

entries=''

append() {
    if [ -n "$entries" ]; then
        entries="${entries},"
    fi
    entries="${entries}$1"
}

if [ -n "${DMARCO_API_BASE_URL:-}" ]; then
    append "\"apiBaseUrl\":\"$(json_escape "$DMARCO_API_BASE_URL")\""
fi

if [ -n "${DMARCO_DISABLE_REGISTRATION:-}" ]; then
    append "\"disableRegistration\":$(json_bool "$DMARCO_DISABLE_REGISTRATION")"
fi

if [ -n "${DMARCO_MOCK_MODE:-}" ]; then
    append "\"mockMode\":$(json_bool "$DMARCO_MOCK_MODE")"
fi

printf 'window.__DMARCO_CONFIG__ = {%s};\n' "$entries" > "$CONFIG_FILE"

echo "[dmarco] runtime config: {${entries}}"
