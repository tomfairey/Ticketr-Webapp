module.exports = {
    importScripts: [],
    inlineWorkboxRuntime: true,
    mode: 'production',
    sourcemap: false,
    globDirectory: "./build",
    globPatterns: [
        "**/*.{css,html,js,gif,ico,jpg,png,svg,webp,woff,woff2,ttf,otf,eot,webmanifest,manifest}"
    ],
    swDest: "build/service-worker.js",
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: new RegExp("^https?:\/\/mt\.google\.com\/.*", "gi"),
            // https://mt.google.com/vt/lyrs=m@221097413,transit&hl=en&x={x}&y={y}&z={z}
            handler: "CacheFirst",
            options: {
                cacheableResponse: {
                    statuses: [0, 200, 404]
                },
                cacheName: "MapTileCache-v2",
                expiration: {
                    maxEntries: 81381, // More or less 1GiB
                    maxAgeSeconds: 6 * 30 * 24 * 60 * 60 // 6 months
                }
            }
        },
        {
            urlPattern: new RegExp("^https?:\/\/(?!(mt\.google\.com\/)|(kkh91b05a8\.execute-api\.eu-west-2\.amazonaws\.com\/)).*", "gi"),
            handler: "NetworkFirst",
            options: {
                cacheableResponse: {
                    statuses: [0, 200]
                },
                cacheName: "RedundancyCache"
            }
        },
        {
            urlPattern: new RegExp("^https?:\/\/kkh91b05a8\.execute-api\.eu-west-2\.amazonaws\.com\/staging\/stops\/.*", "gi"),
            // https://kkh91b05a8.execute-api.eu-west-2.amazonaws.com/staging
            handler: "CacheFirst",
            options: {
                cacheableResponse: {
                    statuses: [200]
                },
                cacheName: "TicketrStops"
            }
        }
    ]
};