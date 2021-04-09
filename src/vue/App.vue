<template>
    <div id="app" :colour-scheme="isDarkMode ? 'dark' : null">
        <section class="app-scaffold" v-if="isReady">
            <nav>
                <Navigation>
                    <NavigationItem :route="{path: '/', name: 'Home'}"></NavigationItem>
                    <NavigationItem :route="{path: '/tickets', name: 'Tickets'}"></NavigationItem>
                </Navigation>
            </nav>
            <main>
                <router-view @toggleLocationPermissionModal="toggleLocationPermissionModal" @displayTicketView="displayTicketView"></router-view>
            </main>
            <Overlays v-if="isReady" :active="overlaysActive">
                <transition name="slide-fade">
                    <router-view name="overlay" @refreshTickets="refreshTickets"></router-view>
                </transition>
                <Store v-if="overlays.store"></Store>
                <Basket v-if="overlays.basket"></Basket>
                <!-- <TicketView v-if="!!overlays.ticketView" :ticket="overlays.ticketView"></TicketView> -->
                <Modal v-if="overlays.locationPermission" heading="Location Permission" falsey="No thanks" truthy="Yes please!" @falsey="falseyLocationPermissionModal" @truthy="truthyLocationPermissionModal">
                    <div style="margin: 0 0 8px;">
                        <Lottie :width="150" :height="140" :options="{ animationData: locationAnimation }"></Lottie>
                    </div>

                    When you provide us your location we can provide you features like <b>departure times at stops near you</b> and <b>live vehicle tracking</b>!<br /><br />

                    So, what do you say?<br />
                    Do you grant us permission to access your location?
                </Modal>
                <Modal v-if="overlays.update" heading="Update Available" falsey="Later" truthy="Reload Now" @falsey="overlays.update = false" @truthy="reloadPage">
                    From time to time we update the app in order to fix any bugs and provide you a better experience.<br /><br />

                    The update has already been installed but the app needs reloading...<br />
                    Can we reload the app now?
                </Modal>
                <Login v-if="overlays.login" @postAuthentication="postAuthentication"></Login>
            </Overlays>
        </section>
        <Splash v-if="overlays.splash">
            <Logo>Ticketr</Logo>
        </Splash>
    </div>
</template>

<script>
    import Lottie from 'vue-lottie';
    import locationAnimation from '../animation/lottie/26037-location-icon.json';

    import Logo from './components/text/Logo.vue';
    import Splash from './components/view/Splash.vue';
    import Overlays from './components/view/Overlays.vue';
    import Navigation from './components/view/Navigation.vue';
    import NavigationItem from './components/view/NavigationItem.vue';
    import Login from './components/view/Login.vue';
    import Modal from './components/view/Modal.vue';
    import TicketView from './components/view/TicketView.vue';
    import Basket from './components/view/Basket.vue';
    import Store from './components/view/Store.vue';

    export default {
        name: "App",
        components: {
            'Logo': Logo,
            'Splash': Splash,
            'Overlays': Overlays,
            'Navigation': Navigation,
            'NavigationItem': NavigationItem,
            'Login': Login,
            'Modal': Modal,
            'TicketView': TicketView,
            'Basket': Basket,
            'Store': Store,
            'Lottie': Lottie
        },
        data() {
            return {
                isReady: false,
                overlays: {
                    splash: true,
                    login: false,
                    update: false,
                    locationPermission: false,
                    ticketView: false,
                    basket: false,
                    store: false
                },
                locationAnimation: locationAnimation
            }
        },
        computed: {
            isDarkMode: function() {
                let isDark = false;

                isDark = this.darkMode();

                return isDark;
            },
            overlaysActive: function() {
                let response = false;
                for(let overlay in this.overlays) {
                    overlay = this.overlays[overlay];

                    // response = !!overlay ? !!overlay : response;
                    if(!!overlay) response = !!overlay;
                }
                if(this.$route.meta.hasOverlay) response = true;
                return response;
            },
            contentOverlaysActive: function() {
                let response = false;
                for(let overlay in this.contentOverlays) {
                    overlay = this.contentOverlays[overlay];

                    response = !!overlay ? !!overlay : response;
                }
                return response;
            }
        },
        methods: {
            darkMode: function() {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    return true;
                }

                return false;
            },
            handleSWUpdated: function() {
                this.overlays.update = true;
            },
            reloadPage: function() {
                window.location.reload();
            },
            postAuthentication: async function({user, profile}) {
                await this.$store.commit("setUser", user);
                await this.$store.commit("setProfile", profile);
                let baskets = await this.$store.state.ticketrApi.getBaskets();
                await this.$store.commit("setBaskets", baskets);
                let orders = await this.$store.state.ticketrApi.getOrders();
                await this.$store.commit("setOrders", orders);
                if(Object.keys(baskets).length == 1) {
                    await this.$store.commit("setBasketToUse", baskets[Object.keys(baskets)[0]]);
                } else {
                    await this.$store.commit("setBasketToUse", await this.$store.state.ticketrApi.newBasket());
                    await this.$store.commit("setBaskets", await this.$store.state.ticketrApi.getBaskets());
                }
                this.toggleLogin(false);
                await (await this.$store.state.database).put("user", `${this.$store.state.ticketrApi.token}`, "accessToken");
                await (await this.$store.state.database).put("user", `${profile.uuid}`, "profile");
                this.isReady = true;
            },
            toggleLogin: function(bool = !this.overlays.login) {
                this.overlays.login = bool;
            },
            toggleSplash: function(bool = !this.overlays.splash) {
                this.overlays.splash = bool;
            },
            completeReadyTasks: async function() {
                try {
                    if(this.$store.state.ticketrApi.hasToken) {
                        let user;
                        try {
                            await this.postAuthentication(await this.$store.state.ticketrApi.refreshAuthentication());
                        } catch(e) {
                            throw new Error("AUTH_FAILURE");
                        }
                    } else {
                        throw new Error("NO_TOKEN");
                    }
                } catch(e) {
                    this.overlays.login = true;
                    this.isReady = true;
                }

                if(navigator.permissions) {
                    let permQueryResponse = await navigator.permissions.query({name: 'geolocation'});
                    if('granted' !== permQueryResponse.state) {
                        this.toggleLocationPermissionModal(true);
                    }
                }

                // this.$store.state.ticketrApi.getStatus().then(r => {
                //     this.statusMessage = r.data.message;
                // });
                // this.$store.state.ticketrApi.getBaskets().then(r => {
                //     this.statusMessage = r.data.message;
                // });
            },
            displayBasket: async function(bool = !this.overlays.basket) {
                this.overlays.basket = bool;
            },
            displayStore: async function(bool = !this.overlays.store) {
                this.overlays.store = bool;
            },
            displayTicketView: async function(uuid) {
                this.overlays.ticketView = await this.$store.getters.getTicket(this.$route.params.uuid);
            },
            toggleLocationPermissionModal: function(bool = !this.overlays.locationPermission) {
                this.overlays.locationPermission = bool;
            },
            falseyLocationPermissionModal: function() {
                this.toggleLocationPermissionModal(false);
            },
            truthyLocationPermissionModal: async function() {
                try {
                    window.navigator.geolocation.getCurrentPosition((e) => {
                        this.toggleLocationPermissionModal(false);
                    }, (e) => {
                        console.error(e);
                    });
                } catch(e) {
                    console.warn(e);
                }
            },
            refreshTickets: function() {
                this.$store.state.ticketrApi.getProfile().then((profile) => {
                    this.$store.commit("setProfile", profile);
                });
            }
        },
        watch: {
            $route (to, from) {
                if(!!document.fullscreenElement) {
                    document.exitFullscreen();
                }
            }
        },
        created() {
            document.addEventListener('SWUpdated', this.handleSWUpdated);
        },
        mounted() {
            this.completeReadyTasks().then(() => {
                setTimeout(() => {
                    this.toggleSplash(false);

                    // if (process.env.NODE_ENV === 'development') {
                    //     document.dispatchEvent(new CustomEvent('SWUpdated', {detail: {}}));
                    // }
                }, 2500);
            });
        },
        beforeDestroy() {
            document.removeEventListener('swUpdated', this.handleSWUpdated);
        }
    }
</script>

<style scoped>
    #app {
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
        position: relative;
        top: 0;
        left: 0;
        /* display: flex;
        flex-direction: column; */
        overflow: hidden;
    }
    .app-scaffold {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .app-scaffold nav {
        position: relative;
        z-index: 2;
    }
    .app-scaffold main {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 1;
    }

    /* Transitions */
    .slide-fade-enter-active {
        transition: transform 0.2s ease-out;
    }
    .slide-fade-leave-active {
        transition: transform 0.15s ease-in;
    }
    .slide-fade-enter {
        transform: translateX(100vw);
    }
    .slide-fade-enter-to {
        transform: translateX(0);
    }
    .slide-fade-leave-to {
        transform: translateX(100vw);
    }
</style>