#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

APP_NAME="${FLY_FRONTEND_APP:-pm-journey-frontend}"
CONFIG_FILE="${FRONTEND_FLY_CONFIG:-${REPO_ROOT}/frontend/fly.toml}"
ENV_FILE="${FRONTEND_ENV_FILE:-${REPO_ROOT}/frontend/.env}"
WORKING_DIR="${FRONTEND_WORKING_DIR:-${REPO_ROOT}/frontend}"
DOCKERFILE_PATH="${FRONTEND_DOCKERFILE:-${WORKING_DIR}/Dockerfile}"

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-frontend-fly.sh [options]

Options:
  --app <name>       Fly app name (default: pm-journey-frontend)
  --config <path>    Path to fly.toml (default: frontend/fly.toml)
  --env-file <path>  Env file for Vite build args (default: frontend/.env)
  -h, --help         Show this help

Environment overrides:
  FLY_FRONTEND_APP, FRONTEND_FLY_CONFIG, FRONTEND_ENV_FILE
  FRONTEND_WORKING_DIR, FRONTEND_DOCKERFILE
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

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "env file not found: ${ENV_FILE}" >&2
  exit 1
fi

if [[ ! -d "${WORKING_DIR}" ]]; then
  echo "frontend working directory not found: ${WORKING_DIR}" >&2
  exit 1
fi

if [[ ! -f "${DOCKERFILE_PATH}" ]]; then
  echo "frontend Dockerfile not found: ${DOCKERFILE_PATH}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

require_env() {
  local key="$1"
  if [[ -z "${!key-}" ]]; then
    echo "Missing required env var in ${ENV_FILE}: ${key}" >&2
    exit 1
  fi
}

require_env "VITE_API_BASE_URL"
require_env "VITE_AUTH0_DOMAIN"
require_env "VITE_AUTH0_CLIENT_ID"
require_env "VITE_AUTH0_AUDIENCE"

if [[ -z "${VITE_STORAGE_PREFIX-}" ]]; then
  VITE_STORAGE_PREFIX="olivia_pm"
fi

echo "Deploying frontend app ${APP_NAME} using ${CONFIG_FILE}"
"${FLY_BIN}" deploy \
  "${WORKING_DIR}" \
  --app "${APP_NAME}" \
  --config "${CONFIG_FILE}" \
  --dockerfile "${DOCKERFILE_PATH}" \
  --build-arg "VITE_API_BASE_URL=${VITE_API_BASE_URL}" \
  --build-arg "VITE_STORAGE_PREFIX=${VITE_STORAGE_PREFIX}" \
  --build-arg "VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}" \
  --build-arg "VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}" \
  --build-arg "VITE_AUTH0_AUDIENCE=${VITE_AUTH0_AUDIENCE}"
