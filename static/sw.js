console.info('Service worker')

// application assets
const toCache = [
	'/dov-bear.gif',
	'/favicon.ico',
	'/offline.html',
	'/placeholder.png',
	'/polar-bear.png',
	'/styles.css',
	'/unplugged.png',
	'/manifest.json',
	'/images/icons/icon-128x128.png',
	'/images/icons/icon-144x144.png',
	'/images/icons/icon-152x152.png',
	'/images/icons/icon-192x192.png',
	'/images/icons/icon-512x512.png',
	'/images/icons/icon-72x72.png',
	'/images/icons/icon-96x96.png',
	'/sw.js',
	'/reg_sw.js'
]

const assetCache = "asset";
const contentCache = "content";

// Step 0: Cache all static assets
self.addEventListener('install', event => {
    console.info('Installing service worker')
    // Install the assets, wait until the 
    // promise resolves
    event.waitUntil(
        caches.open(assetCache)
            .then(cache => cache.addAll(toCache))
    ) // event.waitUntil
}) // self.addEventListener('install')

// Step 1 - intercept the fetch event
self.addEventListener('fetch', event => {
    const req = event.request

    // Check if the request is part of our application asset
    // If it is then load from asset, don't go to the network
    if (toCache.find(v => req.url.endsWith(v))) {
        event.respondWith(
            caches.open(assetCache)
                .then(cache => cache.match(req))
        )
        return
    }

    event.respondWith(
        // Proxy and forward the request 
        fetch(req)
            .then(resp => {
                // We have the response
                // Clone the response
                const copy = resp.clone()
                // Cache a copy of the response with the
                // request as the key
                event.waitUntil(
                    caches.open(contentCache)
                        .then(cache => cache.put(req, copy))
                )
                // Return the response to the browser
                return resp
            }) // then
            .catch(err => {
                // Network issue
                // Check if we are loading the container (HTML page)
                if (req.headers.get('Accept').includes('text/html')) {
                    // Check if we have a previously cached content
                    return caches.open(contentCache)
                        // Attempt to match the content with the request
                        .then(cache => cache.match(req))
                        .then(resp => {
                            // Found the response to the request
                            if (!!resp)
                                return resp
                            // Otherwise load the offline.html
                            return caches.open(assetCache)
                                .then(cache => cache.match('/offline.html'))
                        })
                }
                // Otherwise all other resource type, look it up 
                // from our asset cache
                return caches.match(req)
                // return caches.open(assetCache)
                //     .then(cache => cache.match(req))
            }) // catch
    ) // event.respondWith

}) // self.addEventListener('fetch')