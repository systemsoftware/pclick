const CACHE_NAME = "offline-cache-v1";
const urlsToCache = ["/"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", function (event) {
  console.log("Request URL:", event.request.url);

  if (!event.request.url.startsWith("http")) {
    console.log("Skipping unsupported request:", event.request.url);
    return;
  }

  // Allow requests to localStorage
  if (event.request.url.includes("localStorage")) {
    event.respondWith(new Response(localStorage.getItem("data")));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request to ensure it can be used by both cache and fetch
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(function (response) {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response to store it in the cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
