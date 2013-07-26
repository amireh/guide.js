while inotifywait -re close_write . ; do
  r.js -o build.js
done