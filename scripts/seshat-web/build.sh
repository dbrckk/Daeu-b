#!/usr/bin/env bash
set -euo pipefail

if [[ $# != 2 ]]; then
  echo "Usage: bash scripts/seshat-web/build.sh <Boost 1.74 include directory> <output directory>" >&2
  exit 2
fi
command -v em++ >/dev/null
boost_headers=$(cd "$1" && pwd)
mkdir -p "$2"
output=$(cd "$2" && pwd)
patch_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT

git clone --quiet https://github.com/falvaro/seshat.git "$work/seshat"
cd "$work/seshat"
git checkout --quiet 84c677cf3b916646ea122003236b5ca96039ff2a
git apply "$patch_dir/compatibility.patch"

em++ -O2 -std=gnu++98 -I "$boost_headers" -DBOOST_MATH_DISABLE_DEPRECATED_03_WARNING ./*.cc \
  rnnlib4seshat/{Random,DataExporter,WeightContainer,ClassificationLayer,Layer,Mdrnn,Optimiser}.cpp \
  --embed-file Config@/Config -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=worker \
  -sINVOKE_RUN=0 -sEXPORTED_RUNTIME_METHODS=FS,callMain -sALLOW_MEMORY_GROWTH=1 \
  -sMAXIMUM_MEMORY=134217728 -sSTACK_SIZE=524288 -o "$output/seshat.mjs"
