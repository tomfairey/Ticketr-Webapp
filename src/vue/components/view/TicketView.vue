<template>
    <section class="ticket-view-container" :key="key">
        <section class="ticket-view-navigation-container">
            <div class="ticket-view-navigation-content">
                <div class="ticket-view-navigation-item" @click="$router.go(-1)">
                    <v-icon>mdi-chevron-left</v-icon>
                </div>
            </div>
        </section>
        <section class="ticket-view" v-if="!!ticketClass">
            <section class="ticket-container">
                <div class="ticket-header-container">
                    <div class="ticket-header-background">
                        <ResourceRenderer v-if="!ticketClass.activated || expiry < Date.now()" :resource="ticketClass.ticket.retailingOperator.defaultImage"></ResourceRenderer>
                        <div class="ticket-header-mask" v-if="ticketClass.activated && expiry >= Date.now()">{{ `${ticketClass.ticket.name} `.repeat(ticketClass.ticket.name.split('').length * 23) }}</div>
                        <div class="ticket-header-text" :class="{'active': ticketClass.activated && expiry >= Date.now()}">{{ ticketClass.ticket.name }}</div>
                    </div>
                    <div class="ticket-header-content" :class="{'active': ticketClass.activated && expiry >= Date.now()}">
                        <div class="ticket-header-text">{{ ticketClass.ticket.name }}</div>
                    </div>
                </div>
                <div class="ticket-body-container">
                    <!-- FOR ACTIVATED TICKETS THAT HAVE NOT YET EXPIRED - SHOW A LIVE COUNTDOWN TO THE EXPIRY DATE -->
                    <div class="ticket-body-content" v-if="ticketClass.activated && expiry >= Date.now()">
                        <QRCode @click="toggleQRType" :value="qrCodeType == 0 ? generateTYP01QR({ticketClass, session}) : generateReferenceQR(ticketClass)"></QRCode>
                        <div class="ticket-body-title">Expires</div>
                        <div class="ticket-body-text">{{ generateCountdownString(this.countdown) }}</div>
                    </div>
                    <!-- END -->
                    <!-- FOR TICKETS THAT ARE NOT ACTIVATED OR HAVE EXPIRED -->
                    <div class="ticket-body-content" v-if="!ticketClass.activated || expiry < Date.now()">
                        <div class="ticket-body-title">
                            <!-- USE THE CORRECT TENSE FOR WHETHER TICKET HAS EXPIRED OR WILL EXPIRE -->
                            Expire{{ expiry >= Date.now() ? 's' : 'd' }}
                            <!-- END -->
                        </div>
                        <div class="ticket-body-text">{{ generateTimeString(expiry) }}</div>
                    </div>
                    <!-- END -->
                    <!-- FOR ALL TICKETS -->
                    <div class="ticket-body-content">
                        <div class="ticket-body-title">Purchased</div>
                        <div class="ticket-body-text">{{ generateTimeString(ticketClass.created) }}</div>
                    </div>
                    <div class="ticket-body-content">
                        <div class="ticket-body-uid" v-ripple>{{ compressUUID(ticketClass.uuid) }}</div>
                    </div>
                    <!-- END -->
                </div>
            </section>
            <section class="ticket-container" v-if="!!ticketClass.ticket.description">
                <div class="ticket-body-container">
                    <div class="ticket-body-content ticket-terms-content">
                        <div class="ticket-terms-text">{{ ticketClass.ticket.description }}</div>
                    </div>
                </div>
            </section>
            <section class="ticket-container" v-if="!!ticketClass.ticket.terms">
                <div class="ticket-body-container">
                    <div class="ticket-body-content ticket-terms-content">
                        <div class="ticket-terms-title">Terms &amp; Conditions:</div>
                        <div class="ticket-terms-text">{{ ticketClass.ticket.terms }}</div>
                    </div>
                </div>
            </section>
            <section class="button-container" v-if="!ticketClass.activated && expiry > Date.now()">
                <div class="button-content">
                    <v-btn block color="var(--color-accent)" @click="toggleActivationModal(true)">Activate</v-btn>
                </div>
            </section>
        </section>
        <section class="activation-modal-container" :class="{'active': activationModal}">
            <Modal v-if="activationModal" heading="Activate ticket?" falsey="No thanks" truthy="Yes please!" @falsey="toggleActivationModal(false)" @truthy="activateTicket() && toggleActivationModal(false)">
                If you activate this ticket now it will be valid <b>{{ calculatedExpiry(ticketClass) }}</b>.
                <br /><br />

                Are you sure you want to activate now?
            </Modal>
        </section>
    </section>
</template>

<script>
    import Modal from './Modal.vue';
    import ResourceRenderer from '../resources/ResourceRenderer.vue';
    import QRCode from '../validation/QRCode.vue';

    import sha256 from 'js-sha256';
    const jsotp = require('jsotp');
    const md5 = require('md5');

    export default {
        name: "TicketView",
        components: {
            'Modal': Modal,
            'ResourceRenderer': ResourceRenderer,
            'QRCode': QRCode
        },
        props: [
            'ticket',
            'uuid'
        ],
        data() {
            return {
                key: 0,
                ticketClass: null,
                countdownInterval: null,
                countdown: null,
                session: {
                    uuid: `2ffa7774-59a8-4444-8eef-3dbebf2540e4`,
                    otpKey: 'IFCUEOBTIM3DGOJYIVCTKMJYII4UCQZVG4YTMRJYIIZTONJZINBUMOBVGJBEEM2CGI2EIMSCGNDDON2EGAYDAQZVGE2TKOCEGIZTMRI=', // BASE32!
                    hashKey: 'E4EDB5BCC36E3BC2D3FC98249C53112E7D98FA419D8607F747898051A06E21D2-0C2FC5A0DCB0FBFC1717D9AF91F676A42FF90DF13023AA5A8E39ACC447F8808F'
                },
                qrCode: null,
                activationModal: false,
                qrCodeType: 0
            }
        },
        computed: {
            expiry: function() {
                return this.ticketClass.expiry;
            },
            originHash: function() {
                return this.ticketClass.hashes.origin;
            }
        },
        methods: {
            increaseKey: function() {
                this.key++;
                return this.key;
            },
            getDateNth: function(d) {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                    case 1:  return "st";
                    case 2:  return "nd";
                    case 3:  return "rd";
                    default: return "th";
                }
            },
            generateTimeString: function(date) {
                let time = new Intl.DateTimeFormat(undefined, { timeStyle: 'short', hour12: false }).format(date);
                let day = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(date);
                let month = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date);
                let year = new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(date);

                return `${time} ${day}${this.getDateNth(day)} ${month} ${year}`;
            },
            compressUUID: function(uuid) {
                // uuid = uuid.replaceAll("-", "").toUpperCase();
                uuid = uuid.split("-");
                uuid = `${uuid[0]}${uuid[2]}${uuid[4]}`.toUpperCase();
                return uuid;
            },
            generateCountdownString(countdown) {
                let year = 60 * 60 * 24 * 365;
                let month = 60 * 60 * 24 * 30;
                let day = 60 * 60 * 24;
                let hour = 60 * 60;
                let minute = 60;

                countdown = Math.floor(countdown / 1000);

                let string = '';

                let years = Math.floor(countdown / year);
                if(years > 0) {
                    string += `${years} year${years != 1 ? 's' : ''} `;
                    countdown -= year * years;
                }

                let months = Math.floor(countdown / month);
                if(months > 0) {
                    string += `${months} month${months != 1 ? 's' : ''} `;
                    countdown -= month * months;
                }

                let days = Math.floor(countdown / day);
                if(days > 0) {
                    string += `${days} day${days != 1 ? 's' : ''} `;
                    countdown -= day * days;
                }

                let hours = Math.floor(countdown / hour);
                if(hours > 0) {
                    string += `${hours} hour${hours != 1 ? 's' : ''} `;
                    countdown -= hour * hours;
                }

                let minutes = Math.floor(countdown / minute);
                if(minutes > 0) {
                    string += `${minutes} minute${minutes != 1 ? 's' : ''} `;
                    countdown -= minute * minutes;
                }

                let seconds = Math.floor(countdown);
                string += `${seconds} second${seconds != 1 ? 's' : ''}`;
                countdown -= seconds;

                return string;
            },
            generateTYP01QR: function({ticketClass, session}) {
                let timestamp = Math.floor(Date.now() / 1000);
                let operatorsString = '';
                let locationsString = '';
                let concessionaryString = '';
                let totp = jsotp.TOTP(session['otpKey']);

                for(let operator of ticketClass.ticket.operators) {
                    operatorsString += `${operatorsString !== '' ? `,`: ``}${operator.noc}`;
                }
                for(let locationType in ticketClass.ticket.locations) {
                    let locations = ticketClass.ticket.locations[locationType];
                    for(let location of locations) {
                        let types = {
                            "regions": "r",
                            "administrativeAreas": "aa",
                            "districts": "d"
                        };
                        locationsString += `${locationsString !== '' ? `,`: ``}${types[locationType]}-${location.code}`;
                    }
                }
                // for(let concession in this.ticket['concessions']) {
                //     concession = this.ticket['concessions'][concession];
                //     concessionaryString += `${concessionaryString !== '' ? `;`: ``}${concession.type}:${btoa(concession.id)},${btoa(concession.name)},${concession.required.toString().toUpperCase()},${concession.pre_validated.toString().toUpperCase()}`;
                // }

                let qrHeader =
                    `TICKETR|
                    TICKETR-TYP01`;

                let qrPayload = 
                   `${ticketClass.uuid}|
                    ${btoa(ticketClass.ticket.name)}|
                    ${operatorsString ? btoa(operatorsString) : ''}|
                    ${locationsString ? btoa(locationsString) : ''}|
                    ${concessionaryString ? btoa(concessionaryString) : ''}|
                    ${Math.floor(ticketClass.created / 1000)}|
                    ${ticketClass.activated ? Math.floor(ticketClass.modified / 1000) : 0}|
                    ${Math.floor(ticketClass.expiry / 1000)}
                `.replace(/ {4}|[\t\n\r]/gm,'');

                let qrHashes =
                   `${ticketClass.hashes.origin}|
                    ${md5(sha256.hmac(`${ticketClass.hashes.online}`, `${qrPayload}|${timestamp}`))}|
                    ${md5(sha256.hmac(`${ticketClass.hashes.offline}`, `${qrPayload}|${timestamp}`))}`;

                let qrCode = `${qrPayload}|${qrHashes}|${timestamp}`.replace(/ {4}|[\t\n\r]/gm,'');

                let qrSignature = `${session.uuid}|
                    ${totp.now()}|
                    ${md5(sha256.hmac(session.hashKey, qrCode))}`;

                qrCode = `${qrHeader}|${qrCode}|${qrSignature}`;

                qrCode = qrCode.replace(/ {4}|[\t\n\r]/gm,'');

                return qrCode;
            },
            generateReferenceQR(ticketClass) {
                return `TICKETR|REF-0|${ticketClass.uuid}|${Math.floor(Date.now() / 1000)}`;
            },
            toggleActivationModal: function(bool = !this.activationModal) {
                this.activationModal = bool;
            },
            generateActivationExpiryString(countdown) {
                let year = 60 * 60 * 24 * 365;
                let month = 60 * 60 * 24 * 30;
                let day = 60 * 60 * 24;
                let hour = 60 * 60;
                let minute = 60;

                let string = '';

                let years = Math.floor(countdown / year);
                if(years > 0) {
                    string += `${years} year${years != 1 ? 's' : ''} `;
                    countdown -= year * years;
                }

                let months = Math.floor(countdown / month);
                if(months > 0) {
                    string += `${months} month${months != 1 ? 's' : ''} `;
                    countdown -= month * months;
                }

                let hours = Math.floor(countdown / hour);

                let days = Math.floor(countdown / day);

                if(hours >= 25) {
                    if(days > 0) {
                        string += `${days} day${days != 1 ? 's' : ''} `;
                        countdown -= day * days;
                    }
                }

                hours = Math.floor(countdown / hour);
                if(hours > 0) {
                    string += `${hours} hour${hours != 1 ? 's' : ''} `;
                    countdown -= hour * hours;
                }

                let minutes = Math.floor(countdown / minute);
                if(minutes > 0) {
                    string += `${minutes} minute${minutes != 1 ? 's' : ''} `;
                    countdown -= minute * minutes;
                }

                let seconds = Math.floor(countdown);
                if(seconds > 0) {
                    string += `${seconds} second${seconds != 1 ? 's' : ''} `;
                    countdown -= seconds;
                }

                return string;
            },
            calculatedExpiry: function(ticketClass) {
                let string = ``;

                switch(ticketClass.ticket.validityPeriodType.toString().toLowerCase()) {
                    case "preset":
                        string += `until `;
                        let date = new Date(Date.now() + (ticketClass.ticket.validityPeriod * 1000));
                        date.setHours(0, 0, 0, 0);
                        date = new Date(date.valueOf() + (ticketClass.ticket.expiryDayPeriod * 1000));
                        string += `${this.generateTimeString(date)}`;
                        break;
                    case "full":
                        string += `for `;
                        string += `${this.generateActivationExpiryString(ticketClass.ticket.validityPeriod)}`;
                        string += `from now`;
                        break;
                    default:
                        throw new Error("Unknown validity period type");
                }

                return string;
            },
            activateTicket: async function() {
                await this.ticketClass.activate();
                this.increaseKey();
                this.$emit("refreshTickets");
            },
            toggleQRType() {
                if(this.qrCodeType > 0) {
                    this.qrCodeType = 0;
                } else {
                    this.qrCodeType ++;
                }
            }
        },
        beforeMount: async function() {
            if(this.ticket && this.ticket.constructor.name == "Promise") {
                this.ticketClass = await this.ticket;
            }

            if(!this.ticket || this.ticket.constructor.name !== "TicketrTicketrEntitlement") {
                if(this.$route.params.uuid) {
                    this.ticketClass = await this.$store.getters.getTicket(this.$route.params.uuid);
                }
            }

            if(!this.ticketClass) throw new Error("Failed to fetch ticket with uuid")

            this.countdown = this.ticketClass.expiry.valueOf() - Date.now();
            this.countdownString = this.generateCountdownString(this.countdown);
        },
        mounted: async function() {
            this.countdownInterval = setInterval(() => {
                this.countdown = this.ticketClass.expiry.valueOf() - Date.now();
                this.countdownString = this.generateCountdownString(this.countdown);
                if(this.countdown <= 0) {
                    clearInterval(this.countdownInterval);
                }
            }, 500);
        },
        beforeDestroy() {
            clearInterval(this.countdownInterval);
        }
    }
</script>

<style scoped>
    .ticket-view-container {
        display: flex;
        position: absolute;
        flex-direction: column;
        top: 0;
        bottom: 0;
        margin: 0 auto;
        min-width: min(100%, 768px);
        max-width: 768px;
        background-color: #FFFFFF;
    }
    .ticket-view-container .ticket-view-navigation-container {
        display: flex;
        position: relative;
        flex-shrink: 1;
        margin: 6px 12px;
    }
    .ticket-view-container .ticket-view-navigation-container .ticket-view-navigation-content {
        display: flex;
        position: relative;
    }
    .ticket-view-container .ticket-view-navigation-container .ticket-view-navigation-content .ticket-view-navigation-item {
        display: flex;
        position: relative;
        width: 38px;
        height: 38px;
    }
    .ticket-view-container .ticket-view-navigation-container .ticket-view-navigation-content .ticket-view-navigation-item > i {
        position: relative;
        width: 38px;
        height: 38px;
        font-size: 38px;
        color: #000000;
    }
    .ticket-view-container .ticket-view {
        display: flex;
        position: relative;
        flex-grow: 1;
        flex-direction: column;
        overflow-y: auto;
    }
    .ticket-view-container .ticket-view .ticket-container {
        display: flex;
        position: relative;
        flex-shrink: 1;
        flex-direction: column;
        background-color: rgba(255, 255, 255, 0.8);
        margin: 0 18px 18px 18px;
        /* min-height: calc(100% - 18px); */
        /* height: calc(100% + 18px + 18px + 18px); */
        border-radius: 8px;
        border: 1px #C4C4C4 solid;
        text-align: center;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
        min-height: 88px;
        max-height: 88px;
        border-bottom: 1px #C4C4C4 solid;
        overflow: hidden;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background {
        display: flex;
        position: absolute;
        justify-content: center;
        align-items: center;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        border-radius: 8px 8px 0 0;
        overflow: hidden;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background, .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-content {
        display: flex;
        align-self: center;
        align-items: center;
        text-align: center;
        overflow: hidden;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background .ticket-header-text {
        display: flex;
        align-self: center;
        align-items: center;
        white-space: nowrap;
        font-size: 48px;
        font-family: var(--primary-font);
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        text-align: center;
        z-index: 1;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background .ticket-header-text.active {
        color: rgba(0, 0, 0, 0.4);
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background .ticket-header-mask {
        display: flex;
        position: absolute;
        justify-content: center;
        align-items: center;
        align-content: center;
        width: 268vw;
        margin: 0 0 0 -94vw;
        background: -webkit-linear-gradient(top left, orange , yellow, green, cyan, blue, violet);
        background: -o-linear-gradient(bottom right, orange, yellow, green, cyan, blue, violet);
        background: -moz-linear-gradient(bottom right, orange, yellow, green, cyan, blue, violet);
        background: linear-gradient(from bottom right, orange , yellow, green, cyan, blue, violet);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 11px;
        font-size: 12px;
        font-family: var(--primary-font);
        font-weight: 700;
        animation: rainbowSlide 3s ease-in-out infinite;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-content .ticket-header-text {
        display: flex;
        align-self: center;
        align-items: center;
        /* white-space: nowrap; */
        line-height: 1;
        font-size: 28px;
        padding: 2px;
        font-family: var(--primary-font);
        font-weight: 700;
        color: #FFFFFF;
        text-align: center;
        z-index: 1;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-content.active .ticket-header-text {
        color: #000000;
    }
    @keyframes rainbowSlide {
        to {
            filter: hue-rotate(360deg);
        }
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container {
        display: flex;
        position: relative;
        flex-shrink: 1;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 16px;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 8px;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content .ticket-body-title {
        position: relative;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 18px;
        color: rgba(0, 0, 0, 0.6);
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content .ticket-body-text {
        position: relative;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 24px;
        color: #000000;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content .ticket-body-uid {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 18px;
        color: #000000;
        min-width: 100%;
        padding: 4px 8px;
        background-color: #C4C4C4;
        border-radius: 10px;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content.ticket-terms-content {
        padding: 0;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content.ticket-terms-content .ticket-terms-title {
        position: relative;
        align-self: flex-start;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 24px;
        color: #000000;
        text-align: start;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content.ticket-terms-content .ticket-terms-text {
        position: relative;
        font-family: var(--primary-font);
        font-weight: 600;
        font-size: 18px;
        color: #444444;
        text-align: start;
        white-space: break-spaces;
    }
    .ticket-view-container .ticket-view .button-container {
        display: flex;
        position: relative;
        flex-grow: 1;
        flex-direction: column;
        justify-content: flex-end;
        height: 100%;
        padding: 18px;
    }
    .ticket-view-container .ticket-view .button-container .button-content {
        display: flex;
        position: relative;
        flex-direction: column;
    }

    .ticket-view-container .activation-modal-container {
        display: flex;
        position: absolute;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0);
        pointer-events: none;
        transition: all 0.2s ease-in-out;
    }
    .ticket-view-container .activation-modal-container.active {
        background-color: rgba(0, 0, 0, 0.6);
        pointer-events: all;
    }
</style>