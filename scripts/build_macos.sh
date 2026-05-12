#!/usr/bin/env bash
set -euo pipefail

echo "===== Building Next AI Draw.io for macOS ====="

# Use China mirror for Electron downloads if needed
# Uncomment the line below if you're behind the GFW:
# export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# Determine architecture (default: arm64 for Apple Silicon)
ARCH="${1:-arm64}"
if [[ "$ARCH" != "arm64" && "$ARCH" != "x64" ]]; then
    echo "Usage: $0 [arm64|x64]"
    echo "  arm64  - Apple Silicon (default)"
    echo "  x64   - Intel Mac"
    exit 1
fi

echo "Target architecture: $ARCH"

# Step 1: Build Next.js standalone output
echo ""
echo "[1/4] Building Next.js..."
npm run build

# Step 2: Compile Electron main/preload scripts
echo ""
echo "[2/4] Compiling Electron scripts..."
npm run electron:compile

# Step 3: Prepare standalone directory for packaging
echo ""
echo "[3/4] Preparing Electron build resources..."
npm run electron:prepare

# Step 4: Package with electron-builder (no upload)
echo ""
echo "[4/4] Packaging macOS app ($ARCH)..."
npx electron-builder \
    --config electron/electron-builder.yml \
    --mac \
    --"$ARCH" \
    --publish never

echo ""
echo "===== Build complete ====="
echo "Output: release/mac-${ARCH}/"
ls -lh "release/mac-${ARCH}/" 2>/dev/null || true