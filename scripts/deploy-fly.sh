#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-fly.sh [backend|frontend|all]

Commands:
  backend   Deploy backend only
  frontend  Deploy frontend only
  all       Deploy backend then frontend (default)
USAGE
}

MODE="${1:-all}"

case "${MODE}" in
  backend)
    "${SCRIPT_DIR}/deploy-backend-fly.sh"
    ;;
  frontend)
    "${SCRIPT_DIR}/deploy-frontend-fly.sh"
    ;;
  all)
    "${SCRIPT_DIR}/deploy-backend-fly.sh"
    "${SCRIPT_DIR}/deploy-frontend-fly.sh"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown mode: ${MODE}" >&2
    usage >&2
    exit 1
    ;;
esac

