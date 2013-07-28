#!/usr/bin/env bash

while inotifywait -re close_write . ; do
  lessc --strict-imports --compress ./gjs.less ../../dist/guide.css
done