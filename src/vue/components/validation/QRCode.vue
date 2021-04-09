<template>
    <section class="qr-container">
        <div class="qr-content" @click="$emit('click')" v-ripple>
            <vue-qrcode :value="this.value"></vue-qrcode>
        </div>
    </section>
</template>

<script>
    import VueQrcode from 'vue-qrcode'

    export default {
        name: "QRCode",
        components: {
            VueQrcode
        },
        props: [
            'value'
        ],
        data() {
            return {
                
            }
        }
    }
</script>

<style scoped>
    .qr-container {
        display: flex;
        position: relative;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 240px;
        height: 100%;
        max-height: 240px;
        box-shadow:
            0 0 0 0 rgba(255, 51, 51, 1),
            0 0 0 5px rgba(255, 51, 51, 0.8),
            0 0 0 10px rgba(255, 51, 51, 0.4),
            0 0 0 15px rgba(255, 51, 51, 0.3),
            0 0 0 20px rgba(255, 51, 51, 0);
        margin: 20px;
        animation: rainbowSlide 3s ease-in-out infinite;
    }
    .qr-container .qr-content {
        display: flex;
        position: relative;
        justify-content: center;
        align-items: center;
        width: 240px;
        max-width: 240px;
        height: 240px;
        max-height: 240px;
        background: linear-gradient(to top left, orange, cyan, violet);
        animation: rainbowSlide 3s ease-in-out infinite;
    }
    .qr-container .qr-content > * {
        display: flex;
        position: relative;
        justify-content: center;
        align-items: center;
        width: 240px;
        max-width: 220px;
        height: 240px;
        max-height: 220px;
    }
    @keyframes rainbowSlide {
        to {
            filter: hue-rotate(360deg);
        }
    }
</style>