<template>
    <section class="home-page">
        <div class="map-container">
            <div class="map" ref="map">
                
            </div>
        </div>
        <div class="content-container">
            <div class="content">
                <div class="overlay-container bottom right">
                    <div class="overlay-content">
                        <div class="overlay-icon large" @click="handleLocationRequest">
                            <v-icon>mdi-crosshairs-gps</v-icon>
                        </div>
                    </div>
                </div>
                <div class="overlay-container bus-overlay">
                    <BusOverlay :bus="'180755'"></BusOverlay>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
    import L from 'leaflet';
    import 'leaflet.locatecontrol';
    import 'leaflet.markercluster';
    import Geohash from 'latlon-geohash';

    import 'leaflet/dist/leaflet.css';
    import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
    import 'leaflet.markercluster/dist/MarkerCluster.css';
    import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

    import BusOverlay from '../components/view/BusOverlay.vue';

    import busStopIcon from '../../img/map/markers/bus_stop_marker.svg';
    import tramStopIcon from '../../img/map/markers/tram_stop_marker.svg';
    import trainStationIcon from '../../img/map/markers/train_station_marker.svg';

    L.Marker.include({
        _slideToUntil:    undefined,
        _slideToDuration: undefined,
        _slideToLatLng:   undefined,
        _slideFromLatLng: undefined,
        _slideKeepAtCenter: undefined,
        _slideDraggingWasAllowed: undefined,

        // 🍂method slideTo(latlng: LatLng, options: Slide Options): this
        // Moves this marker until `latlng`, like `setLatLng()`, but with a smooth
        // sliding animation. Fires `movestart` and `moveend` events.
        slideTo: function slideTo(latlng, options) {
            if (!this._map) return;

            this._slideToDuration = options.duration;
            this._slideToUntil    = performance.now() + options.duration;
            this._slideFromLatLng = this.getLatLng();
            this._slideToLatLng   = latlng;
            this._slideKeepAtCenter = !!options.keepAtCenter;
            this._slideDraggingWasAllowed =
                this._slideDraggingWasAllowed !== undefined ?
                    this._slideDraggingWasAllowed :
                    this._map.dragging.enabled();

            if (this._slideKeepAtCenter) {
                this._map.dragging.disable();
                this._map.doubleClickZoom.disable();
                this._map.options.touchZoom = 'center';
                this._map.options.scrollWheelZoom = 'center';
            }

            this.fire('movestart');
            this._slideTo();

            return this;
        },

        // 🍂method slideCancel(): this
        // Cancels the sliding animation from `slideTo`, if applicable.
        slideCancel: function slideCancel() {
            L.Util.cancelAnimFrame(this._slideFrame);
        },

        _slideTo: function _slideTo() {
            if (!this._map) return;

            var remaining = this._slideToUntil - performance.now();

            if (remaining < 0) {
                this.setLatLng(this._slideToLatLng);
                this.fire('moveend');
                if (this._slideDraggingWasAllowed ) {
                    this._map.dragging.enable();
                    this._map.doubleClickZoom.enable();
                    this._map.options.touchZoom = true;
                    this._map.options.scrollWheelZoom = true;
                }
                this._slideDraggingWasAllowed = undefined;
                return this;
            }

            var startPoint = this._map.latLngToContainerPoint(this._slideFromLatLng);
            var endPoint   = this._map.latLngToContainerPoint(this._slideToLatLng);
            var percentDone = (this._slideToDuration - remaining) / this._slideToDuration;

            var currPoint = endPoint.multiplyBy(percentDone).add(
                startPoint.multiplyBy(1 - percentDone)
            );
            var currLatLng = this._map.containerPointToLatLng(currPoint)
            this.setLatLng(currLatLng);

            if (this._slideKeepAtCenter) {
                this._map.panTo(currLatLng, {animate: false})
            }

            this._slideFrame = L.Util.requestAnimFrame(this._slideTo, this);
        }

    });

    L.Marker.addInitHook(function(){
        this.on('move', this.slideCancel, this);
    });

    export default {
        name: "Home",
        components: {
            'BusOverlay': BusOverlay
        },
        data() {
            return {
                defaultMapBounds: [[ 49.82380908513249, -10.8544921875 ], [ 59.478568831926395, 2.021484375 ]],
                mainMap: null,
                locationControl: null,
                stopsLayer: L.markerClusterGroup(),
                vehicleLayer: L.layerGroup([]),
                stopsResponseObject: {},
                stopsObject: {},
                vehicleObject: {},
                vehicleDataObject: {},
                lastGeohash: null,
                lastVehicleFetchTime: 0,
                refreshWaitingOn: new Set(),
                socket: null,
                backoff: 1000,
                newSocket: null
            }
        },
        methods: {
            hasLocationPermission: async function() {
                if(navigator.permissions) {
                    let permQueryResponse = await navigator.permissions.query({name: 'geolocation'});
                    if('granted' === permQueryResponse.state) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
            fetchLoadMapData: async function() {
                let centerPointLatLng = this.mainMap.getCenter();
                let boundsLatLng = this.mainMap.getBounds();
                let centerGeohash = Geohash.encode(centerPointLatLng.lat, centerPointLatLng.lng, 5);
                let geohashNeighbours = Geohash.neighbours(centerGeohash);

                let canLookupGeohash = /^(?=(gb(g|u|v|y|z))|(gc)|(gf)|(gg(4|5))|(u1(0|1(5|h)|2|3))).*$/.test(centerGeohash); // Ensures hash is in UK otherwise save the traffic

                // console.log(this.mainMap.getZoom());

                if(this.mainMap.getZoom() >= 14 && canLookupGeohash) {

                    /*
                        Stop accidental DoS of the vehicle API
                            - Enforcing a max of 1 call per 15 secs
                            UNLESS
                                The current geohash was not the previously called geohash
                                AND
                                The current geohash was not a neighbour of the previously called geohash
                    */

                    // if(this.lastVehicleFetchTime + 15 <= Math.floor(Date.now() / 1000) || (this.lastGeohash !== centerGeohash && !Object.keys(geohashNeighbours).filter(h => geohashNeighbours[h] === this.lastGeohash).length)) {
                        // let vehicleData = await this.fetchVehicleData(boundsLatLng);
                        // if(vehicleData) {
                        //     await this.showVehicles(vehicleData);
                        //     this.lastVehicleFetchTime = Math.floor(Date.now() / 1000);
                        // }
                        this.sendBoundsSocket();
                    // }

                    if(centerGeohash !== this.lastGeohash) {
                        // geohashes['c'] = centerGeohash;

                        // delete geohashNeighbours['ne'];
                        // delete geohashNeighbours['se'];
                        // delete geohashNeighbours['sw'];
                        // delete geohashNeighbours['nw'];

                        // geohashes = {
                        //     c: centerGeohash,
                        //     n: geohashes['n'],
                        //     e: geohashes['e'],
                        //     s: geohashes['s'],
                        //     w: geohashes['w'],
                        //     ne: geohashes['ne'],
                        //     se: geohashes['se'],
                        //     sw: geohashes['sw'],
                        //     nw: geohashes['nw']
                        // };

                        // this.stopsLayer.clearLayers();

                        if(!this.stopsResponseObject.hasOwnProperty(centerGeohash)){
                            let geohashData = await this.fetchStopData(centerGeohash);
                            if(geohashData) {
                                this.stopsResponseObject[centerGeohash] = geohashData;
                                await this.showStops(geohashData);
                            }
                        }
                        //  else {
                        //     await this.showStops(this.stopsResponseObject[centerGeohash]);
                        // }

                        // for(let geohash in geohashNeighbours) {
                        //     geohash = geohashNeighbours[geohash];

                        //     await this.loadStops(geohash);
                        // }
                    }

                    if(!this.mainMap.hasLayer(this.stopsLayer)) {
                        this.stopsLayer.addTo(this.mainMap);
                    }
                    if(!this.mainMap.hasLayer(this.vehicleLayer)) {
                        this.vehicleLayer.addTo(this.mainMap);
                    }

                    this.lastGeohash = centerGeohash;
                } else if(this.mainMap.getZoom() <= 11) {
                    if(this.mainMap.hasLayer(this.stopsLayer)) {
                        this.mainMap.removeLayer(this.stopsLayer);
                    }
                    if(this.mainMap.hasLayer(this.vehicleLayer)) {
                        this.mainMap.removeLayer(this.vehicleLayer);
                    }
                }
            },
            loadStops: async function(geohash) {
                if(!this.stopsObject[geohash]){
                    // let geohashData = await this.fetchStopData(geohash);
                    this.refreshWaitingOn.add(geohash);
                    this.fetchStopData(geohash).then(async geohashData => {
                        if(geohashData) {
                            await this.showStops(geohashData);
                            this.refreshWaitingOn.delete(geohash);
                        }
                        this.stopsObject[geohash] = geohashData;
                    }).catch(e => {
                        console.warn(e);
                        this.refreshWaitingOn.delete(geohash);
                    });
                } else {
                    await this.showStops(this.stopsObject[geohash]);
                }
            },
            fetchStopData: async function(geohash) {
                try {
                    let stopsAPIRequest = await fetch(`https://kkh91b05a8.execute-api.eu-west-2.amazonaws.com/staging/stops/${geohash}`);
                    let stopsAPIResponse = await stopsAPIRequest.json();
                    return stopsAPIResponse.stops;
                } catch(e) {
                    console.warn(e);
                    return false;
                }
            },
            fetchVehicleData: async function(boundsLatLng) {
                try{
                    let vehiclesAPIRequest = await fetch(`https://kkh91b05a8.execute-api.eu-west-2.amazonaws.com/staging/vehicles/bustimes?ymax=${boundsLatLng.getNorthEast().lat}&xmax=${boundsLatLng.getNorthEast().lng}&ymin=${boundsLatLng.getSouthWest().lat}&xmin=${boundsLatLng.getSouthWest().lng}`);
                    let vehiclesAPIResponse = await vehiclesAPIRequest.json();
                    return vehiclesAPIResponse.features;
                } catch(e) {
                    console.warn(e);
                    return false;
                }
            },
            showStops: async function(stops) {
                let disallowed_types = []; // ['train_station'];
                for(let stop in stops) {
                    stop = stops[stop];
                    if(!this.stopsObject.hasOwnProperty(stop['atco_code']) && !disallowed_types.includes(stop['type'])) {
                        let description = '';
                        let iconUrl = '';

                        switch(stop.type) {
                            case "bus_stop":
                                iconUrl = busStopIcon;
                                break;
                            case "tram_stop":
                                iconUrl = tramStopIcon;
                                break;
                            case "tube_stop":
                                iconUrl = tubeStopIcon;
                                break;
                            case "train_station":
                                iconUrl = trainStationIcon;
                                break;
                            default:
                                iconUrl = '';
                                break;
                        }
                        let marker = L.marker([stop.latitude, stop.longitude], {
                            icon: L.icon({
                                iconUrl: iconUrl,
                                iconSize:     [34, 53], // size of the icon
                                iconAnchor:   [17.5, 53], // point of the icon which will correspond to marker's location
                                popupAnchor:  [0, -33] // point from which the popup should open relative to the iconAnchor
                            }),
                            draggable: false,
                            title: stop.name,
                            opacity: 1
                        });
                        this.stopsObject[stop['atco_code']] = marker;
                        marker.bindPopup(`<u><strong>${stop.name}</strong></u><br />${description}`);
                        marker.addTo(this.stopsLayer);
                    }
                }
            },
            makeVehicleMarkerHTML: function(route_name, heading, status, textColour = null) {
                let colour;
                switch(status) {
                    case "R":
                        colour = '#ba5e3d';
                        break;
                    case "A":
                        colour = '#f5ba42';
                        break;
                    case "G":
                        colour = '#009b77';
                        break;
                    // default:
                    //     colour = '#2c69b1';
                    //     break;
                }
                if(!colour) {
                    switch(route_name.toLowerCase()) {
                        case "red":
                            colour = '#ba5e3d';
                            break;
                        case "orange":
                            colour = '#f5ba42';
                            break;
                        case "green":
                            colour = '#009b77';
                            break;
                        default:
                            colour = 'var(--color-dark-accent)';
                            break;
                    }
                }
                return `<div style="position: relative; display: flex; justify-content: center; align-items: center; width: 42px; height: 42px; --icon-color: ${colour};">
                    ${ heading !== null ?
                        `<div style="position: absolute; width: 42px; height: 42px; transform: rotate(${heading + 45}deg); background-color: var(--icon-color); border-radius: 0 100% 100% 100%;">` :
                        `<div style="position: absolute; width: 42px; height: 42px; background-color: var(--icon-color); border-radius: 100% 100% 100% 100%;">`
                    }
                    </div>
                    <div style="position: absolute; display: flex; justify-content: center; overflow: hidden; align-items: center; border-radius: 100%; width: 34px; height: 34px; background: ${status ? status : '#FFFFFF'}; text-align: center; line-height: 1.3; font-size: 14px; font-family: var(--primary-font); font-weight: 700; color: ${textColour ? textColour : '#222222'};">
                        ${route_name ? route_name : ''}
                    </div>
                </div>`;
            },
            showVehicles: async function(vehicles) {
                // this.vehicleLayer.clearLayers();
                for(let vehicle in vehicles) {
                    vehicle = vehicles[vehicle];
                    if(this.vehicleObject[vehicle['properties']['vehicle']['url']]) {
                        this.vehicleObject[vehicle['properties']['vehicle']['url']].setIcon(L.divIcon({
                            html: this.makeVehicleMarkerHTML(vehicle['properties']['service']['line_name'], vehicle['properties']['direction'], vehicle['properties']['vehicle']['livery'], vehicle['properties']['vehicle']['text_colour']),
                            iconSize: [42, 42], // size of the icon
                            iconAnchor: [21, 21], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        }));
                        this.vehicleObject[vehicle['properties']['vehicle']['url']].slideTo([vehicle['geometry']['coordinates'][1], vehicle['geometry']['coordinates'][0]], {
                            duration: 700
                        });
                    } else {
                        this.vehicleObject[vehicle['properties']['vehicle']['url']] = L.marker([vehicle['geometry']['coordinates'][1], vehicle['geometry']['coordinates'][0]], {
                            icon: L.divIcon({
                                html: this.makeVehicleMarkerHTML(vehicle['properties']['service']['line_name'], vehicle['properties']['direction'], vehicle['properties']['vehicle']['livery'], vehicle['properties']['vehicle']['text_colour']),
                                iconSize: [42, 42], // size of the icon
                                iconAnchor: [21, 21], // point of the icon which will correspond to marker's location
                                popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                            }),
                            draggable: false,
                            opacity: 1
                        }).bindPopup(`<u><strong>${vehicle['properties']['service']['line_name']} - ${vehicle['properties']['destination']}</strong></u><br />${vehicle['properties']['operator']}<br />${vehicle['properties']['vehicle']['name']}`)
                        .on('click', (e) => {
                            this.mainMap.setView(e.target.getLatLng());
                            this.showVehicleInfoOverlay(vehicle);
                        });
                    }
                    if(!this.vehicleLayer.hasLayer(vehicle)) {
                        this.vehicleObject[vehicle['properties']['vehicle']['url']].addTo(this.vehicleLayer);
                    }
                }
                // for(let vehicle in this.vehicleObject) {
                //     let vehicleFn = `${vehicle}`;
                //     vehicle = this.vehicleObject[vehicle];
                //     if(this.vehicleLayer.hasLayer(vehicle) && (!this.mainMap.getBounds().contains(vehicle.getLatLng()) || vehicles.filter(v => v['properties']['vehicle']['url'] === vehicleFn).length === 0)) {
                //         this.vehicleLayer.removeLayer(vehicle);
                //         // delete this.vehicleObject[vehicle];
                //     }
                // }
            },
            showShortVehicles: async function(vehicles) {
                // this.vehicleLayer.clearLayers();
                for(let vehicle in vehicles) {
                    vehicle = vehicles[vehicle];
                    if(this.vehicleObject[vehicle['i']] && this.mainMap.getBounds().contains(this.vehicleObject[vehicle['i']].getLatLng())) {
                        this.vehicleObject[vehicle['i']].setIcon(L.divIcon({
                            html: this.makeVehicleMarkerHTML(vehicle['r'], vehicle['h'], vehicle['c'], vehicle['t']),
                            iconSize: [42, 42], // size of the icon
                            iconAnchor: [21, 21], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        }));
                        this.vehicleObject[vehicle['i']].slideTo([vehicle['l'][1], vehicle['l'][0]], {
                            duration: 700
                        });
                    } else {
                        this.vehicleObject[vehicle['i']] = L.marker([vehicle['l'][1], vehicle['l'][0]], {
                            icon: L.divIcon({
                                html: this.makeVehicleMarkerHTML(vehicle['r'], vehicle['h'], vehicle['c'], vehicle['t']),
                                iconSize: [42, 42], // size of the icon
                                iconAnchor: [21, 21], // point of the icon which will correspond to marker's location
                                popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                            }),
                            draggable: false,
                            opacity: 1
                        });
                        // .bindPopup(`<u><strong>${vehicle['properties']['service']['line_name']} - ${vehicle['properties']['destination']}</strong></u><br />${vehicle['properties']['operator']}<br />${vehicle['properties']['vehicle']['name']}`)
                        // .on('click', (e) => {
                        //     this.mainMap.setView(e.target.getLatLng());
                        //     this.showVehicleInfoOverlay(vehicle);
                        // });
                    }
                    // if(!this.vehicleLayer.hasLayer(vehicle)) {
                    //     this.vehicleObject[vehicle['i']].addTo(this.vehicleLayer);
                    // }
                }
                for(let vehicle in this.vehicleObject) {
                    let vehicleFn = `${vehicle}`;
                    vehicle = this.vehicleObject[vehicle];
                    if(this.mainMap.getBounds().contains(vehicle.getLatLng())) {
                        if(!this.vehicleLayer.hasLayer(vehicle)) {
                            this.vehicleObject[vehicleFn].addTo(this.vehicleLayer);
                        }
                    } else {
                        if(this.vehicleLayer.hasLayer(vehicle)) {
                            this.vehicleLayer.removeLayer(vehicle);
                        }
                    }
                    // if(this.vehicleLayer.hasLayer(vehicle) && (!this.mainMap.getBounds().contains(vehicle.getLatLng()) /* || vehicles.filter(v => v['i'] === vehicleFn).length === 0 */ )) {
                    //     this.vehicleLayer.removeLayer(vehicle);
                    //     // delete this.vehicleObject[vehicle];
                    // } else if(!this.vehicleLayer.hasLayer(vehicle) && this.mainMap.getBounds().contains(vehicle.getLatLng())) {
                    //     this.vehicleObject[vehicle['i']].addTo(this.vehicleLayer);
                    // }
                }
            },
            showVehicleInfoOverlay: function(vehicle) {
                console.log("I am:", vehicle['properties']['vehicle']['url']);
            },
            connectSocket: function() {
                if (this.socket && this.socket.readyState < 2) { // already CONNECTING or OPEN
                    return; // no need to reconnect
                }
                let url = 'wss://bustimes.org/ws/vehicle_positions';
                this.socket = new WebSocket(url);

                this.socket.onopen = this.openSocket;

                this.socket.onclose = this.closeSocket;

                this.socket.onerror = function(event) {
                    console.error(event);
                };

                this.socket.onmessage = this.onMessageSocket;

                // this.socket.onmessage = function(event) {
                //     let data = JSON.parse(event.data);
                //     this.showShortVehicles(data);
                //     // if (this.newSocket) {
                //     //     if (this.vehicleObject) {
                //     //         this.vehicleLayer.clearLayers();
                //     //     }
                //     //     this.vehicleObject = {};
                //     //     this.vehicleDataObject = {};
                //     // }
                //     // this.newSocket = false;
                //     // for (let i = data.length - 1; i >= 0; i--) {
                //     //     // console.log(data[i]);
                //     //     this.vehicleDataObject[data[i].i] = data[i];
                //     // }
                //     // this.showShortVehicles(this.vehicleDataObject);
                // };
            },
            openSocket: function() {
                this.backoff = 1000;
                this.newSocket = true;

                // this.sendBoundsSocket();
                // this.socket.send(JSON.stringify([-7.5600, 49.9600, 1.7800, 60.8400]));
            },
            closeSocket: function(event) {
                if (event.code > 1000) {  // not 'normal closure'
                    setTimeout(connect, this.backoff);
                    this.backoff += 500;
                }
            },
            onMessageSocket: function(event) {
                let data = JSON.parse(event.data);
                this.showShortVehicles(data);
            },
            sendBoundsSocket: function() {
                this.connectSocket();
                
                let bounds = this.mainMap.getBounds();
                this.socket.send(JSON.stringify([
                    bounds.getWest() - 0.2,
                    bounds.getSouth() - 0.2,
                    bounds.getEast() + 0.2,
                    bounds.getNorth() + 0.2
                ]));
            },
            handleLocationRequest: async function() {
                if(await this.hasLocationPermission()) {
                    this.locationControl.start();
                } else {
                    // Display modal requesting location permission (pre-browser as, if denied, we cannot re-request)
                    this.$emit("toggleLocationPermissionModal", true);
                }
            }
        },
        mounted: async function() {
            this.mainMap = L.map(this.$refs['map'], {
                renderer: L.canvas(),
                zoomControl: false,
                attributionControl: false
            }).fitBounds(this.defaultMapBounds);

            window.mainMap = this.mainMap;

            L.tileLayer('https://mt.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',{
                // tileSize: 192
            }).addTo(this.mainMap);
            // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ }).addTo(this.mainMap);

            this.connectSocket();

            this.locationControl = L.control.locate({
                setView: 'untilPanOrZoom',
                flyTo: false,
                initialZoomLevel: 15,
                cacheLocation: true,
                showCompass: true,
                drawCircle: true,
                // onLocationError: () => {
                //     this.setLocationStatus(false)
                // },
                showPopup: false,
                locateOptions: {
                    maxZoom: 15,
                    enableHighAccuracy: true,
                    watch: true
                }
            }).addTo(this.mainMap);

            if(await this.hasLocationPermission()) {
                this.locationControl.start();
            }

            this.stopsLayer.addTo(this.mainMap);
            this.vehicleLayer.addTo(this.mainMap);

            this.mainMap.on("drag", async () => {
                if(this.mainMap.getZoom() >= 14) {
                    for(let vehicle in this.vehicleObject) {
                        let vehicleFn = `${vehicle}`;
                        vehicle = this.vehicleObject[vehicle];
                        if(this.mainMap.getBounds().contains(vehicle.getLatLng())) {
                            if(!this.vehicleLayer.hasLayer(vehicle)) {
                                this.vehicleObject[vehicleFn].addTo(this.vehicleLayer);
                            }
                        } else {
                            if(this.vehicleLayer.hasLayer(vehicle)) {
                                this.vehicleLayer.removeLayer(vehicle);
                            }
                        }
                    }
                }
            });
            this.mainMap.on("moveend", async () => {
                await this.fetchLoadMapData();
            });
        },
        beforeDestroy: function() {
            this.socket ? this.socket.close() : null;
        }
    }
</script>

<style>
    .map .leaflet-control-locate {
        display: none;
    }
    .map .leaflet-top.leaflet-left {
        position: absolute;
        top: 92px;
    }
    .map .leaflet-div-icon {
        background: transparent;
        border: none;
    }
    .map > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-marker-pane > div.leaflet-marker-icon.leaflet-control-locate-location > svg > circle {
        fill: var(--color-dark-accent) !important;
    }
    .map > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-marker-pane > div.leaflet-marker-icon.leaflet-control-locate-heading > svg > path {
        fill: var(--color-dark-accent) !important;
    }
</style>

<style scoped>
    .home-page {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .map-container {
        position: absolute;
        z-index: 1;
        width: 100%;
        height: 100%;
    }
    .map-container .map {
        position: relative;
        padding-top: 100px;
        margin: 0 -21px -21px -21px;
        width: calc(100% + 42px);
        height: calc(100% + 21px);
    }
    .content-container {
        position: absolute;
        z-index: 2;
        top: 204px;
        left: 0;
        bottom: 0;
        right: 0;
        pointer-events: none;
    }
    .content-container .content {
        display: flex;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        padding: 8px;
    }
    .content-container .content .overlay-container {
        position: relative;
        margin: auto;
    }
    .content-container .content .overlay-container.bus-overlay {
        position: absolute;
    }
    .content-container .content .overlay-container.top {
        align-self: flex-start;
        margin-top: 0;
    }
    .content-container .content .overlay-container.right {
        justify-self: flex-end;
        margin-right: 0;
    }
    .content-container .content .overlay-container.bottom {
        align-self: flex-end;
        margin-bottom: 0;
    }
    .content-container .content .overlay-container.left {
        justify-self: flex-start;
        margin-left: 0;
    }
    .content-container .content .overlay-container .overlay-content {
        display: flex;
        position: relative;
        pointer-events: all;
    }
    .content-container .content .overlay-container .overlay-content .overlay-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        font-size: 16px;
        background-color: var(--color-dark-accent);
        color: #FFFFFF;
        border-radius: 100%;
    }
    .content-container .content .overlay-container .overlay-content .overlay-icon.large {
        font-size: 32px;
        width: 64px;
        height: 64px;
    }
    .content-container .content .overlay-container .overlay-content .overlay-icon > i {
        font-size: inherit;
        color: inherit;
    }
</style>