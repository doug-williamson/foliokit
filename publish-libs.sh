#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

read -rp "Enter your OTP code: " OTP

LIBS=("cms-ui" "cms-markdown" "cms-admin-ui" "docs-ui")

for lib in "${LIBS[@]}"; do
  echo ""
  echo ">>> Publishing @foliokit/$lib ..."
  (cd "$ROOT/dist/libs/$lib" && npm publish --access public --otp="$OTP")
  echo "    @foliokit/$lib published successfully"
done

echo ""
echo "All done. Run 'npm view @foliokit/<name> version' to verify."
