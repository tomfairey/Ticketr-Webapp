<template>
    <section class="basket-container">
        <section class="navigation-container">
            <div class="navigation-content">
                <div class="navigation-item icon start" @click="$router.go(-1)">
                    <v-icon>mdi-chevron-left</v-icon>
                </div>
                <div class="navigation-item text center">
                    <div class="title">Basket</div>
                </div>
                <div class="navigation-item text end">
                    <div class="title">£{{ basketTotal.toFixed(2)}}</div>
                </div>
            </div>
        </section>
        <section class="basket-content" v-if="!orderProcess">
            <div class="tickets-container">
                <div class="ticket-container" v-for="(ticket, ticketIndex) in basket.tickets" :key="`basket:${ticketIndex}:${ticket.uuid}:${ticket.quantity}`">
                    <BuyTicketCard :ticket="ticket.ticket" :quantity="ticket.quantity" @click="addToBasket(ticket.ticket)"></BuyTicketCard>
                </div>
            </div>
            <div class="totals-container">
                <div class="totals-content">
                    <div class="checkout-button">
                        <Alert @click="checkout">
                            <template v-slot:icon-start>mdi-cart-outline</template>
                            <template v-slot:default>Checkout {{ basketCount }} item{{ basketCount != 1 ? 's' : '' }}</template>
                            <template v-slot:icon-end>mdi-chevron-right</template>
                        </Alert>
                    </div>
                </div>
            </div>
        </section>
        <section class="order-container" v-if="orderProcess">
            <div class="order-content">
                <div class="warning-container">
                    <Alert>
                        <template v-slot:icon-start>mdi-alert-outline</template>
                        <template v-slot:default>Basket loss on exit!</template>
                    </Alert>
                </div>
                <div class="overview-container">
                    <div class="overview-content">
                        <div class="overview-item" v-for="(ticket, ticketIndex) in order.tickets" :key="`order:${ticket.quantity}:${ticket.ticket.uuid}:${ticketIndex}`">
                            {{ ticket.quantity }} - {{ ticket.ticket.name }}
                        </div>
                    </div>
                </div>
                <div class="warning-container">
                    <Alert>
                        <template v-slot:icon-start>mdi-alert-outline</template>
                        <template v-slot:default>Test mode - Don't use real card info!</template>
                    </Alert>
                </div>
                <div class="payment-container">
                    <div class="payment-container">
                        <div id="stripe-payment-request-button" v-if="canPaymentRequest"></div>
                        <div id="stripe-card-element" v-if="!canPaymentRequest"></div>
                        <v-btn v-if="!canPaymentRequest" block @click="completeCardPayment()">Complete Payment</v-btn>
                    </div>
                </div>
            </div>
        </section>
    </section>
</template>

<script>
    import Alert from './Alert.vue';
    import BuyTicketCard from './BuyTicketCard.vue';

    export default {
        name: "Basket",
        components: {
            'Alert': Alert,
            'BuyTicketCard': BuyTicketCard
        },
        data() {
            return {
                orderProcess: false,
                baskets: this.$store.state.baskets,
                loading: true,
                error: false,
                order: null,
                elements: this.$store.state.stripe.elements(),
                clientSecret: null,
                paymentRequest: null,
                paymentRequestButton: null,
                canPaymentRequest: true,
                cardElement: null
            }
        },
        computed: {
            basket() {
                return this.$store.state.basketToUse;
            },
            basketCount: function() {
                let basketCount = 0;

                let basket = this.$store.state.basketToUse;
                for(let ticket in basket.tickets) {
                    ticket = basket.tickets[ticket];
                    basketCount += ticket.quantity;
                }

                return basketCount;
            },
            basketTotal: function() {
                let basketTotal = 0;

                let basket = this.$store.state.basketToUse;
                for(let ticket in basket.tickets) {
                    ticket = basket.tickets[ticket];
                    basketTotal += ticket.ticket.price * ticket.quantity;
                }

                return basketTotal;
            }
        },
        methods: {
            addToBasket: async function(ticket) {
                this.loading = true;
                await this.$store.state.basketToUse.add(ticket);
                this.loading = false;
            },
            checkout: async function() {
                let order = await this.$store.state.basketToUse.checkout();
                this.order = order;
                this.orderProcess = true;
                this.paymentRequest = this.$store.state.stripe.paymentRequest({
                    country: 'GB',
                    currency: 'gbp',
                    total: {
                        label: 'Total',
                        amount: await order.getPaymentIntentAmount(),
                    },
                    requestPayerName: true,
                    requestPayerEmail: true,
                });
                this.paymentRequestButton = this.elements.create('paymentRequestButton', {
                    paymentRequest: this.paymentRequest
                });
                this.canPaymentRequest = await this.paymentRequest.canMakePayment();
                this.clientSecret = await order.getPaymentIntentClientSecret();
                if(this.canPaymentRequest) {
                    this.paymentRequestButton.mount('#stripe-payment-request-button');
                    paymentRequest.on('paymentmethod', this.completePaymentRequestPayment);
                } else {
                    this.cardElement = this.elements.create("card", {
                        style: {
                            base: {
                                color: "#765CF2",
                            }
                        }
                    });
                    this.cardElement.mount("#stripe-card-element");
                }
            },
            completeCardPayment: async function() {
                let confirmResult = await this.$store.state.stripe.confirmCardPayment(this.clientSecret, {
                        payment_method: {
                            card: this.cardElement
                        },
                        setup_future_usage: 'off_session'
                    },
                    {
                        handleActions: false
                    }
                );
                if (confirmResult.error) {
                    alert("Payment failure");
                } else {
                    if (confirmResult.paymentIntent.status === "requires_action") {
                        // Let Stripe.js handle the rest of the payment flow.
                        let result = await this.$store.state.stripe.confirmCardPayment(this.clientSecret);
                        if (result.error) {
                            alert("Payment failure");
                        } else {
                            if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                                if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                                    alert("Amount is not capturing!?");
                                }
                            }
                            this.$router.go(-1);
                        }
                    } else {
                        if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                            if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                                alert("Amount is not capturing!?");
                            }
                        }
                        this.$router.go(-1);
                    }
                };
            },
            completePaymentRequestPayment: async function(ev) {
                let confirmResult = await this.$store.state.stripe.confirmCardPayment(this.clientSecret, {
                        payment_method: ev.paymentMethod.id,
                        setup_future_usage: 'off_session'
                    },
                    {
                        handleActions: false
                    }
                );
                if (confirmResult.error) {
                    ev.complete('fail');
                } else {
                    ev.complete('success');
                    if (confirmResult.paymentIntent.status === "requires_action") {
                        // Let Stripe.js handle the rest of the payment flow.
                        let result = await this.$store.state.stripe.confirmCardPayment(this.clientSecret);
                        if (result.error) {
                            ev.complete('fail');
                            alert("Payment failure");
                        } else {
                            ev.complete('success');
                            if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                                if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                                    alert("Amount is not capturing!?");
                                }
                            }
                            this.$router.go(-1);
                        }
                    } else {
                        ev.complete('success');
                        if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                            if(await this.order.getPaymentIntentStatus() === "requires_capture") {
                                alert("Amount is not capturing!?");
                            }
                        }
                        this.$router.go(-1);
                    }
                };
            }
        },
        mounted: async function() {
            await this.$store.state.basketToUse.update();
        }
    }
</script>

<style scoped>
    .basket-container {
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
    .basket-container .navigation-container {
        display: flex;
        position: absolute;
        z-index: 2;
        width: 100%;
        height: 60px;
        align-items: flex-start;
        background-color: var(--color-accent);
        border-radius: 0% 0% 50% 50% / 0% 0% 10% 10%;
        transition: all 0.3s ease-in-out;
    }
    .basket-container .navigation-container .navigation-content {
        display: flex;
        width: 100%;
        height: 56px;
        padding: 4px;
    }
    .basket-container .navigation-container .navigation-content .navigation-item {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #FFFFFF;
    }
    .basket-container .navigation-container .navigation-content .navigation-item.start {
        justify-self: flex-start;
        justify-content: flex-start;
        flex-shrink: 1;
    }
    .basket-container .navigation-container .navigation-content .navigation-item.center {
        justify-self: center;
        justify-content: center;
        flex-grow: 1;
    }
    .basket-container .navigation-container .navigation-content .navigation-item.end {
        justify-self: flex-end;
        justify-content: flex-end;
        flex-shrink: 1;
    }
    .basket-container .navigation-container .navigation-content .navigation-item.text {
        /* flex-grow: 1; */
        font-family: var(--primary-font);
        font-weight: 500;
        font-size: 18px;
    }
    .basket-container .navigation-container .navigation-content .navigation-item.icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 38px;
    }
    .basket-container .navigation-container .navigation-content .navigation-item.icon > * {
        font-size: 30px;
        color: inherit;
    }
    .basket-container .basket-content, .basket-container .order-container {
        display: flex;
        position: relative;
        flex-direction: column;
        flex-basis: 100%;
        width: 100%;
        padding: 0;
        overflow: overlay;
    }
    .basket-container .basket-content .tickets-container, .basket-container .order-container .order-content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-height: 100%;
        padding: 68px 8px 82px;
        overflow-x: overlay;
        overflow-y: auto;
    }
    .basket-container .basket-content .tickets-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .basket-container .basket-content .tickets-container .ticket-container {
        min-width: 400px;
        width: 400px;
        max-width: 400px;
        padding: 0 4px;
    }
    .basket-container .basket-content .totals-container {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        padding: 8px 4px;
    }
    .basket-container .basket-content .totals-container .checkout.button {
        display: flex;
    }
</style>