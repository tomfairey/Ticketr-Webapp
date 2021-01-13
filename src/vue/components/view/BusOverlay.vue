<template>
    <section class="bus-overlay-container">
        <!-- https://bustimes.org/vehicles/locations/180755 a[href^="/services/"] a[href^="/vehicles/"] -->
        <!--    https://bustimes.org/services/8-ecclesfield-crystal-peaks #map[data-service] -->
        <!--        wss://bustimes.org/ws/vehicle_positions/services/45735 -->
        <!--        https://bustimes.org/services/45735.json -->
        <!--    https://bustimes.org/vehicles/244508 -->
        <!--    https://bustimes.org/api/vehicles/244508 -->
        <!--        wss://bustimes.org/ws/vehicle_positions/operators/SYRK -->
        <section class="bus-overlay">
            <div class="bus-graphic-container">
                <div class="bus-graphic">

                </div>
            </div>
            <div class="bus-data-container">
                <div class="bus-data">
                    <div class="license"></div>
                </div>
            </div>
        </section>
    </section>
</template>

<script>
    export default {
        name: "BusOverlay",
        props: [
            'bus'
        ]
    }
</script>

<style scoped>

</style>