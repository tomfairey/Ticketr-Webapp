<template>
    <section class="alert-container" @click="playMusic">
        <div class="alert-contents" :class="{'start-padding': !this.$slots['icon-start'] && !!this.$slots.default, 'end-padding': !this.$slots['icon-end'] && !!this.$slots.default}">
            <div class="alert-content-container icon start" v-if="!!this.$slots['icon-start']">
                <div class="alert-content">
                    <v-icon>
                        <slot name="icon-start"></slot>
                    </v-icon>
                </div>
            </div>
            <div class="alert-content-container text" v-if="!!this.$slots.default">
                <div class="alert-content">
                    <slot></slot>
                </div>
            </div>
            <div class="alert-content-container icon end" v-if="!!this.$slots['icon-end']">
                <div class="alert-content">
                    <v-icon>
                        <slot name="icon-end"></slot>
                    </v-icon>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
    import {Howl, Howler} from 'howler';

    export default {
        name: "Alert",
        data() {
            return {
                audio: null,
                source: null,
                sources: null,
                hasBeenPlayed: false
            }
        },
        methods: {
            playMusic: function() {
                this.$emit("click");

                if (process.env.NODE_ENV === 'development') {
                    if(!this.hasBeenPlayed) {
                        this.hasBeenPlayed = true;
                        
                        this.audio.play("mainRegion");
                    
                        this.audio.once("end", () => {
                            this.audio.play("loopRegion");
                        });
                    } else if(this.audio.playing()) {
                        this.audio.pause();
                    } else {
                        this.audio.play();
                    }
                }
            }
        },
        mounted() {
            if (process.env.NODE_ENV === 'development') {
                this.sources = {
                    "bgm000": {
                        src: require("../../../audio/bgm000.wav"),
                        start: 0,
                        end: 0,
                        name: "Unknown"
                    },
                    "bgm001": {
                        src: require("../../../audio/bgm001.wav"),
                        start: 2181,
                        end: 56727,
                        name: "Gumshoe"
                    },
                    "bgm002": {
                        src: require("../../../audio/bgm002.wav"),
                        start: 8000,
                        end: 46399,
                        name: "Cornered"
                    },
                    "bgm003": {
                        src: require("../../../audio/bgm003.wav"),
                        start: 1599,
                        end: 39999,
                        name: "Cornered Variation"
                    },
                    "bgm004": {
                        src: require("../../../audio/bgm004.wav"),
                        start: 25999,
                        end: 49999,
                        name: "Objection"
                    },
                    "bgm005": {
                        src: require("../../../audio/bgm005.wav"),
                        start: 2181,
                        end: 71999,
                        name: "Trick"
                    },
                    "bgm006": {
                        src: require("../../../audio/bgm006.wav"),
                        start: 2307,
                        end: 76153,
                        name: "Maya"
                    },
                    "bgm007": {
                        src: require("../../../audio/bgm007.wav"),
                        start: 0,
                        end: 0,
                        name: "Unknown"
                    },
                    "bgm008": {
                        src: require("../../../audio/bgm008.wav"),
                        start: 4800,
                        end: 38399,
                        name: "Defendant Lobby"
                    },
                    "bgm010": {
                        src: require("../../../audio/bgm010.wav"),
                        start: 1904,
                        end: 47619,
                        name: "Moderato 2001"
                    },
                    "bgm011": {
                        src: require("../../../audio/bgm011.wav"),
                        start: 1791,
                        end: 59104,
                        name: "Allegro 2001"
                    },
                    "bgm012": {
                        src: require("../../../audio/bgm012.wav"),
                        start: 6000,
                        end: 57999,
                        name: "Search Core"
                    },
                    "bgm013": {
                        src: require("../../../audio/bgm013.wav"),
                        start: 9599,
                        end: 57599,
                        name: "Trial"
                    }
                };
                
                this.source = Object.keys(this.sources)[Math.floor(Math.random() * (Object.keys(this.sources).length - 1))]

                let source = this.sources[this.source];

                this.audio = new Howl({
                    src: source.src,
                    volume: 1,
                    loop: false,
                    sprite: {
                        mainRegion: [0, source.end],
                        loopRegion: [source.start, source.end - source.start, true],
                    }
                });
            }
        },
        beforeDestroy() {
            if (process.env.NODE_ENV === 'development') {
                this.audio.pause();
                this.audio = null;
            }
        }
    }
</script>

<style scoped>
    .alert-container {
        position: relative;
        outline: none;        
        background-color: #EEEEEE;
        color: #444444;
        border: 1px solid #BBBBBB;
        border-radius: 8px;
        min-height: 48px;
        margin: 8px;
    }
    .alert-contents {
        display: flex;
    }
    .alert-contents.start-padding {
        padding-left: 32px;
    }
    .alert-contents.end-padding {
        padding-right: 32px;
    }
    .alert-content-container.icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 44px;
        height: 44px;
        margin: 2px;
    }
    .alert-content-container.icon i {
        width: 32px;
        height: 32px;
    }
    .alert-content-container.text {
        position: relative;
        flex-grow: 1;
        font-size: 18px;
        font-weight: 700;
        font-family: var(--primary-font);
        line-height: 48px;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .alert-contents .alert-content-container.text:after {
        content: '';
        position: absolute;
        width: calc(100% - 2px);
        height: calc(100% - 2px);
        top: 0;
        margin: 1px;
        border-radius: 8px;
        background: linear-gradient(to right, #EEEEEE00 85%, #EEEEEEFF 100%);
    }
    .alert-contents.end-padding .alert-content-container.text:after {
        left: 32px;
    }
</style>