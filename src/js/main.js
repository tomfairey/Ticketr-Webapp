import '../css/main.css';
import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';

import * as idb from 'idb';

import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import Toasted from 'vue-toasted';
import '@mdi/font/css/materialdesignicons.css';
import VuexRouterSync from 'vuex-router-sync';

import FingerprintJS from '@fingerprintjs/fingerprintjs';

import { TicketrAPI } from './ticketr-api-sdk';

// if (process.env.NODE_ENV === 'development') {
    // import { TicketrAPI } from 'G:\\GitHub\\Ticketr-API-SDK';
// }

import App from '../vue/App.vue';
import Home from '../vue/pages/Home.vue';
import Tickets from '../vue/pages/Tickets.vue';

//      // Old-caches clean-up code
//
// (async () => {
//     try {
//         await caches.delete('MapTileCache');
//     } catch(e) {
//         console.log(e);
//     }
// })
//
//      // End old-caches clean-up code

(async () => {
    Vue.use(Vuex);
    Vue.use(VueRouter);
    Vue.use(Vuetify);
    Vue.use(Toasted, {
        iconPack: 'mdi'
    });

    let routes = [
        {
            name: "Home",
            path: "/",
            component: Home
        },
        {
            name: "Tickets",
            path: "/tickets",
            component: Tickets,
            children: [
                {
                    name: "Basket",
                    path: "basket"
                },
                {
                    name: "Store",
                    path: "store"
                },
                {
                    name: "Ticket",
                    path: ":uuid"
                }
            ]
        }
    ];

    let database;

    try {
        database = await idb.openDB("ticketrDB", 1, {
            upgrade(db, oldVersion, newVersion, transaction) {
                db.createObjectStore("user");
            }
        });
    } catch(e) {
        console.error(e);
    }

    try {
        navigator.storage.persist();
    } catch(e) {
        console.warn("IDB Persistence not granted", e);
    }

    let previousAccess;
    try {
        previousAccess = await database.get("user", "accessToken");
    } catch(e) {
        console.info("Client has no saved accessToken");
    }

    let previousProfile;
    try {
        previousProfile = await database.get("user", "profile");
    } catch(e) {
        console.info("Client has no saved profile");
    }

    let ticketrApi = new TicketrAPI({
        profile: previousProfile ? previousProfile : null,
        token: previousAccess ? previousAccess : null,
    });

    const store = new Vuex.Store({
        state: {
            stripe: Stripe('pk_test_brDgoDDlE7DnK4GwCMPcTMau00Obl0Dk6a'),
            ticketrApi: ticketrApi,
            database: database,
            navigation: {
                mainRoutes: routes
            },
            user: null,
            profile: null,
            device: null,
            baskets: null,
            basketToUse: null,
            orders: null
        },
        getters: {
            // activeTickets: state => {
            //     return state.profile.tickets.filter(r => console.log(r.uuid, r.activated) && r.activated);
            // }
            getTicket: state => uuid => {
                return state.profile.tickets.filter(r => r.uuid == uuid)[0];
            }
        },
        mutations: {
            setUser (state, user) {
                state.user = user;
            },
            setProfile (state, profile) {
                state.profile = profile;
            },
            setBaskets (state, baskets) {
                state.baskets = baskets;
            },
            setBasketToUse (state, basket) {
                state.basketToUse = basket;
            },
            setOrders (state, orders) {
                state.orders = orders;
            }
        }
    });

    const router = new VueRouter({routes});

    const opts = {};
    const vuetify = new Vuetify(opts);

    Vue.config.devtools = true;
    // Vue.config.productionTip = false;

    VuexRouterSync.sync(store, router);

    new Vue({
        store: store,
        router: router,
        vuetify,
        render: createElement => createElement(App)
    }).$mount('#app');
})();