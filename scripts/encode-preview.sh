#!/usr/bin/env bash
set -euo pipefail

frames='.preview-frames/frame-%03d.png'

ffmpeg -y \
  -framerate 12 \
  -i "$frames" \
  -vf 'fps=12,scale=960:-1:flags=lanczos' \
  dist/preview.gif

ffmpeg -y \
  -framerate 12 \
  -i "$frames" \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  dist/preview.mp4
