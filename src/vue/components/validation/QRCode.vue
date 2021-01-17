<template>
    <section class="qr-container">
        <div class="qr-content" v-ripple>
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
            0 0 0 0 hsl(0, 100%, 60%),
            0 0 0 5px hsl(10, 100%, 70%),
            0 0 0 10px hsl(20, 100%, 80%),
            0 0 0 15px hsl(30, 100%, 90%),
            0 0 0 20px hsl(40, 100%, 100%);
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