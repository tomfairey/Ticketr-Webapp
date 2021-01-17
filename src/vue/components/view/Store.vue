<template>
    <section class="store-container">
        <section class="navigation-container">
            <div class="navigation-content">
                <div class="navigation-item" @click="$router.go(-1)">
                    <v-icon>mdi-chevron-left</v-icon>
                </div>
            </div>
        </section>
        <section class="store-content">
            <div class="tickets-container" v-if="!loading && !error">
                <div class="ticket-container" v-for="(ticket, ticketIndex) in tickets" :key="`buy:${ticketIndex}:${ticket.uuid}`">
                    <BuyTicketCard :ticket="ticket" :quantity="!!basket.get(ticket) ? basket.get(ticket).quantity : 0" @click="addToBasket(ticket)"></BuyTicketCard>
                </div>
            </div>
        </section>
    </section>
</template>

<script>
    import BuyTicketCard from './BuyTicketCard.vue';

    export default {
        name: "Store",
        components: {
            'BuyTicketCard': BuyTicketCard
        },
        data() {
            return {
                tickets: [],
                baskets: this.$store.state.baskets,
                basket: this.$store.state.basketToUse,
                loading: true,
                error: false
            }
        },
        methods: {
            log(...args) {
                console.log(args);
            },
            getTickets: async function() {
                this.loading = true;

                try {
                    this.tickets = await this.$store.state.ticketrApi.getTickets();
                } catch(e) {
                    // There was an error, prompt to check connection and retry
                    this.error = true;
                } finally {
                    this.loading = false;
                }
            },
            addToBasket: async function(ticket) {
                this.loading = true;
                await this.basket.add(ticket);
                this.loading = false;
            }
        },
        mounted() {
            this.getTickets();
        }
    }
</script>

<style scoped>
    .store-container {
        display: flex;
        position: absolute;
        flex-direction: column;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: #FFFFFF;
        overflow: hidden;
    }
    .store-container .navigation-container {
        display: flex;
        position: absolute;
        z-index: 2;
        width: 100%;
        height: 92px;
        align-items: flex-start;
        background-color: var(--color-accent);
        border-radius: 0% 0% 50% 50% / 0% 0% 10% 10%;
        transition: all 0.3s ease-in-out;
    }
    .store-container .store-content {
        display: flex;
        position: relative;
        flex-direction: column;
        width: 100%;
        padding: 92px 4px 4px;
        overflow-y: auto;
    }
    .store-container .store-content .tickets-container {
        padding: 4px 8px;
    }
    .store-container .store-content .tickets-container .ticket-container {
        padding: 0 4px;
    }
</style>