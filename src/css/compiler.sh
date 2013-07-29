#!/usr/bin/env bash

lessc --strict-imports --compress ./gjs.less ../../dist/guide.css

while inotifywait -re close_write . ; do
  lessc --strict-imports --compress ./gjs.less ../../dist/guide.css
done