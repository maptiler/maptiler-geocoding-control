#!/bin/bash
set -e

export GIT_WORK_TREE=../cdn.maptiler.com
export GIT_DIR=$GIT_WORK_TREE/.git

git checkout main

git pull

VERSION=GO-165 #$npm_package_version

git checkout -b maptiler-geocoding-control-$VERSION

BASE=../cdn.maptiler.com/maptiler-geocoding-control

mkdir -p $BASE/v$VERSION

cp -r dist/* $BASE/v$VERSION

ln -sfn v$VERSION $BASE/latest

git add maptiler-geocoding-control/v$VERSION maptiler-geocoding-control/latest

git reset maptiler-geocoding-control/v$VERSION/*.tgz

git commit -m "Add maptiler-geocoding-control v$VERSION"

gh pr create --base main --fill --repo maptiler/cdn.maptiler.com
