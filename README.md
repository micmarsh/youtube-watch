
# YouTube Watcher

Super bare-bones synchronization of YouTube videos between two clients (greater numbers not tested)

# Build

## Dev

`browserify youtube.js peer.js main.js > bundle.js`

## Production

`browserify youtube.js peer.js main.js | uglifyjs -c -m > bundle.js`

Or comparable tools
