#!/usr/bin/env bash
set -euo pipefail

archive=$1
production_url=${PRODUCTION_URL%/}
domain=${production_url#https://}

if [[ "$production_url" != https://* || ! "$domain" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$ ]]; then
  echo 'Set PRODUCTION_URL to the public HTTPS origin.' >&2
  exit 1
fi
if [[ ! "$PRODUCTION_SSH_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ || ! "$PRODUCTION_SSH_USER" =~ ^[a-z_][a-z0-9_-]*$ ]]; then
  echo 'Set PRODUCTION_SSH_HOST and PRODUCTION_SSH_USER.' >&2
  exit 1
fi

for variable in POSTGRES_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN_PASSWORD KEYCLOAK_BACKEND_CLIENT_SECRET; do
  if [[ ! "${!variable}" =~ ^[a-fA-F0-9]{32,}$ ]]; then
    echo "Set $variable to a random secret with at least 32 hexadecimal characters." >&2
    exit 1
  fi
done

umask 077
ssh_dir=$(mktemp -d)
trap 'rm -rf -- "$ssh_dir"' EXIT
printf '%s\n' "${PRODUCTION_SSH_KEY:?Set the deployment private key}" > "$ssh_dir/key"
printf '%s\n' "${PRODUCTION_SSH_KNOWN_HOSTS:?Set the verified SSH host key}" > "$ssh_dir/known_hosts"
ssh_options=(-i "$ssh_dir/key" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$ssh_dir/known_hosts")

target="$PRODUCTION_SSH_USER@$PRODUCTION_SSH_HOST"
release_dir="eventflow/releases/$GITHUB_SHA-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
ssh "${ssh_options[@]}" "$target" "umask 077 && mkdir -p '$release_dir'"
scp "${ssh_options[@]}" "$archive" "$target:$release_dir/release.tar.gz"

{
  printf 'EVENTFLOW_DOMAIN=%s\n' "$domain"
  for variable in POSTGRES_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN_PASSWORD KEYCLOAK_BACKEND_CLIENT_SECRET; do
    printf '%s=%s\n' "$variable" "${!variable}"
  done
} | ssh "${ssh_options[@]}" "$target" \
  "umask 077 && cd '$release_dir' && cat > .env && tar -xzf release.tar.gz && docker compose --project-name eventflow up -d"

curl --fail --silent --show-error --retry 24 --retry-delay 5 --retry-all-errors "$production_url/" -o /dev/null
curl --fail --silent --show-error --retry 24 --retry-delay 5 --retry-all-errors "$production_url/api/events" \
  | jq --exit-status '.events | type == "array"' > /dev/null
curl --fail --silent --show-error --retry 24 --retry-delay 5 --retry-all-errors \
  "$production_url/auth/realms/EventFlow/.well-known/openid-configuration" \
  | jq --exit-status --arg issuer "$production_url/auth/realms/EventFlow" '.issuer == $issuer' > /dev/null
