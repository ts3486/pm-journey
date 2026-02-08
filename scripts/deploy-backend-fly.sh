#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

APP_NAME="${FLY_BACKEND_APP:-pm-journey-backend}"
CONFIG_FILE="${BACKEND_FLY_CONFIG:-${REPO_ROOT}/backend/fly.toml}"
ENV_FILE="${BACKEND_ENV_FILE:-${REPO_ROOT}/backend/.env}"
SKIP_SECRETS="${BACKEND_SKIP_SECRETS:-0}"
INCLUDE_DATABASE_URL="${BACKEND_INCLUDE_DATABASE_URL:-0}"

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-backend-fly.sh [options]

Options:
  --app <name>           Fly app name (default: pm-journey-backend)
  --config <path>        Path to fly.toml (default: backend/fly.toml)
  --env-file <path>      Env file to read secrets from (default: backend/.env)
  --skip-secrets         Skip fly secrets sync before deploy
  --include-database-url Also sync DATABASE_URL from env file
  -h, --help             Show this help

Environment overrides:
  FLY_BACKEND_APP, BACKEND_FLY_CONFIG, BACKEND_ENV_FILE
  BACKEND_SKIP_SECRETS=1, BACKEND_INCLUDE_DATABASE_URL=1
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      APP_NAME="$2"
      shift 2
      ;;
    --config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --skip-secrets)
      SKIP_SECRETS=1
      shift
      ;;
    --include-database-url)
      INCLUDE_DATABASE_URL=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if command -v flyctl >/dev/null 2>&1; then
  FLY_BIN="flyctl"
elif command -v fly >/dev/null 2>&1; then
  FLY_BIN="fly"
else
  echo "flyctl (or fly) is not installed." >&2
  exit 1
fi

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "fly config not found: ${CONFIG_FILE}" >&2
  exit 1
fi

if [[ "${SKIP_SECRETS}" != "1" ]]; then
  if [[ ! -f "${ENV_FILE}" ]]; then
    echo "env file not found: ${ENV_FILE}" >&2
    echo "Use --skip-secrets or provide --env-file." >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a

  secret_pairs=()
  secret_keys=()

  add_secret_if_set() {
    local key="$1"
    local value="${!key-}"
    if [[ -n "${value}" ]]; then
      secret_pairs+=("${key}=${value}")
      secret_keys+=("${key}")
    fi
  }

  add_secret_if_set "AUTH0_DOMAIN"
  add_secret_if_set "AUTH0_AUDIENCE"
  add_secret_if_set "GEMINI_API_KEY"

  if [[ "${INCLUDE_DATABASE_URL}" == "1" ]]; then
    add_secret_if_set "DATABASE_URL"
  fi

  if [[ "${#secret_pairs[@]}" -gt 0 ]]; then
    echo "Syncing backend secrets to ${APP_NAME}: ${secret_keys[*]}"
    "${FLY_BIN}" secrets set "${secret_pairs[@]}" --app "${APP_NAME}"
  else
    echo "No backend secrets found in ${ENV_FILE}; skipping fly secrets set."
  fi
fi

echo "Deploying backend app ${APP_NAME} using ${CONFIG_FILE}"
"${FLY_BIN}" deploy --app "${APP_NAME}" --config "${CONFIG_FILE}"

