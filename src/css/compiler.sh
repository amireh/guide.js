#!/usr/bin/env bash

while inotifywait -re close_write . ; do
  lessc --strict-imports --compress ./guide.less ../../dist/guide.css
done