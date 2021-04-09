<template>
    <section class="stop-overlay-container" ref="container" @click.stop="">
        <section class="stop-overlay" v-if="error">
            <div class="error-container">
                <div class="error-content">
                    <p>An error has occured</p>
                </div>
            </div>
        </section>
        <section class="stop-overlay">
            <div class="pull-up-container" ref="pull-up">
                <div class="pull-up-content"></div>
            </div>
            <div class="stop-data-container" v-if="!!stop">
                <div class="stop-data">
                    <div class="heading">
                        {{ parseIndicator(stop.indicator) }} {{ longestName(stop.name, stop['short_name']) }}
                    </div>
                    <div class="subheading">
                        {{ stop.street_name }}
                    </div>
                    <div class="subheading">
                        {{ stop.atco_code }}
                    </div>
                </div>
                <div class="time-data" v-if="!times">
                    <div class="loading-container">
                        <div class="loading-content">
                            <v-progress-circular :size="50" indeterminate color="var(--color-dark-accent)"></v-progress-circular>
                        </div>
                    </div>
                </div>
                <div class="time-data" v-if="!!times">
                    <div class="time-container" v-for="(time, timeIndex) in times" :key="`vehicle-time:${timeIndex}`">
                        <div class="time-content">
                            <div class="route">{{ time.service.line_name }}</div>
                            <div class="info">
                                <div class="destination">{{ time.destination.name }}</div>
                                <div class="operator">{{ time.service.operators[0].name }}</div>
                            </div>
                            <div class="time">{{ generateTimeString(!!time.aimed_arrival_time ? time.aimed_arrival_time : time.aimed_departure_time) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </section>
</template>

<script>
    export default {
        name: "StopOverlay",
        props: [
            'atco'
        ],
        data() {
            return {
                error: null,
                stop: null,
                times: null
            }
        },
        methods: {
            generateTimeString(timeString) {
                let date = new Date(Date.parse(timeString));

                return `${("00" + date.getUTCHours()).substr(-2, 2)}:${("00" + date.getUTCMinutes()).substr(-2, 2)}`;
            },
            longestName(name, shortName) {
                if(!name) return shortName;
                if(!shortName) return name;

                if(shortName.split("").length > name.split("").length) return shortName;
                
                return name
            },
            parseIndicator(indicator) {
                if(!indicator) return '';

                switch(indicator.toLowerCase()) {
                    case "adj":
                    case "adjacent":
                        return "Adjacent";
                    case "nr":
                    case "near":
                        return "Near";
                    case "o/s":
                    case "outside":
                    case "opp":
                    case "opposite":
                        return "Opposite";
                    case "behind":
                        return "Behind";
                    case "inside":
                        return "Inside";
                    case "by":
                        return "By";
                    case "in":
                        return "In";
                    case "at":
                        return "At";
                    case "on":
                        return "On";
                    case "before":
                        return "Before";
                    case "just before":
                        return "Just before";
                    case "after":
                        return "After";
                    case "just after":
                        return "Just after";
                    case "corner of":
                        return "Corner of";
                    default:
                        return indicator;
                }
            },
            handleOverlayTouchStart(e) {
                this.touchStart = e.touches[0].clientY;
            },
            handleOverlayTouchMove(e) {
                let touchEnd = e.changedTouches[0].clientY;

                let maxHeight = (75 * Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / 100); //75vh Calculation

                if(!!this.$refs["container"]) {
                    if(touchEnd > document.body.offsetHeight - 80) {
                        this.$refs["container"].style.top = `${this.$refs["container"].offsetHeight + touchEnd}px`;
                        setTimeout(() =>{
                            this.$emit("close");
                        }, 300);
                    } else if(this.$refs["container"].parentElement.offsetHeight + (this.$refs["container"].parentElement.offsetHeight - maxHeight) < this.$refs["container"].offsetHeight + touchEnd) {
                        this.$refs["container"].style.top = `${-100 + touchEnd}px`;
                    }
                }
            }
        },
        mounted: async function() {
            this.$refs["pull-up"].addEventListener("touchstart", this.handleOverlayTouchStart);
            this.$refs["pull-up"].addEventListener("touchmove", this.handleOverlayTouchMove);

            const unregisterRouterGuard = this.$router.beforeEach((to, from, next) => {
                this.$emit("close");
                next(false);
            });

            this.$once('hook:destroyed', () => {
                unregisterRouterGuard();
            });

            if(!this.atco) {
                this.error = true;
            } else {
                try {
                    let stop = this.$store.getters.getStop(this.atco);
                    this.stop = stop;

                    try {
                        // https://bustimes.org/stops/370022625/times.json
                        // let request = await fetch(`https://bustimes.org/stops/${this.atco}/times.json`);

                        // https://api.ticketr.toms-home.co.uk/ticketr/stop/370022625/departures
                        let request = await fetch(`https://api.ticketr.toms-home.co.uk/ticketr/stop/${this.atco}/departures`);

                        if(request.status != 200) throw new Error("REQUEST_ERROR");

                        let stopTimes = await request.json();

                        if(!stopTimes.hasOwnProperty('times')) throw new Error("NO_TIMES_BODY");

                        this.times = stopTimes['times'];
                    } catch(e) {

                    }
                } catch(e) {
                    this.error = true;
                }
            }
        }
    }
</script>

<style scoped>
    .stop-overlay-container {
        display: flex;
        position: absolute;
        flex-direction: column;
        justify-content: flex-start;
        width: calc(100% + 8px);
        min-height: 300px;
        max-height: 70vh;
        height: min-content;
        padding: 0 16px 0 16px;
        border-radius: 24px 24px 0px 0px;
        border: 4px #BBBBBB solid;
        border-bottom: none;
        background-color: #FFFFFF;
        transition: all 0.1s ease-out;
        bottom: 0;
    }
    #app[colour-scheme="dark"] .stop-overlay-container {
        border-color: #333333;
        background-color: #000000;
    }
    .stop-overlay-container .stop-overlay {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .stop-overlay-container .stop-overlay .pull-up-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 8px 0 8px 0;
    }
    .stop-overlay-container .stop-overlay .pull-up-container .pull-up-content {
        display: flex;
        height: 6px;
        width: 64px;
        border-radius: 8px;
        background-color: #BBBBBB;
    }
    .stop-overlay-container .stop-overlay .stop-data-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .stop-data {
        flex-shrink: 1;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .stop-data .heading {
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 28px;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .stop-data .subheading {
        font-family: var(--primary-font);
        font-weight: 600;
        font-size: 18px;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data {
        flex-grow: 1;
        min-width: 100%;
        padding: 4px 2px;
        overflow-y: auto;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data .time-container {
        display: flex;
        flex-direction: column;
        font-family: var(--primary-font);
        min-width: 100%;
        padding: 4px;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data .time-container .time-content {
        display: flex;
        flex-direction: row;
        align-items: center;
        min-width: 100%;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data .time-container .time-content .route {
        display: flex;
        justify-self: flex-start;
        justify-content: center;
        align-items: center;
        min-width: max-content;
        font-size: 24px;
        font-weight: 700;
        width: 48px;
        padding: 4px;
        border-radius: 4px;
        background-color: var(--color-dark-accent);
        filter: invert(1) hue-rotate(180deg);
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data .time-container .time-content .info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 8px;
        flex-grow: 1;
        overflow: hidden;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data .time-container .time-content .info .destination {
        display: flex;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 14px;
        font-weight: 600;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data .time-container .time-content .info .operator {
        display: flex;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 12px;
    }
    .stop-overlay-container .stop-overlay .stop-data-container .time-data .time-container .time-content .time {
        justify-self: flex-end;
        min-width: max-content;
        font-size: 18px;
        font-weight: 600;
    }
</style>