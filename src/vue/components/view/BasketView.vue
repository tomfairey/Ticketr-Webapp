<template>
    <section class="basket-container">
        <div class="basket" v-for="(basket, basketIndex) in baskets" :key="basketIndex">
            <h3>Basket: {{ basket.uuid }}</h3>
            <div class="ticket" v-for="(ticket, ticketIndex) in basket.tickets" :key="ticketIndex">
                {{ ticket.ticket.name }} - x{{ ticket.quantity }} = £{{ ticket.ticket.price * ticket.quantity }}
            </div>
        </div>
        <br /><br />
        <div class="order" v-for="(order, orderIndex) in orders" :key="orderIndex">
            <h3>Order: {{ order.uuid }}</h3>
            <div class="ticket" v-for="(ticket, ticketIndex) in order.tickets" :key="ticketIndex">
                {{ ticket.ticket.name }} - x{{ ticket.quantity }} = £{{ ticket.ticket.price * ticket.quantity }}
            </div>
            <v-btn @click="payForOrder(order.uuid)">Pay for Order</v-btn>
        </div>
        <div class="stripe-elements-container">
            <br />
            <div v-if="!!currentPaymentIntent">Please only use fake card information, such as 4242 ... 4242 04/24 242</v-btn>
            <br />
            <br />
            <div id="basket-stripe-card-element"></div>
            <br />
            <v-btn v-if="!!currentPaymentIntent" @click="submitPayment">Submit payment</v-btn>
        </div>
    </section>
</template>

<script>
    import { StripeElements } from 'vue-stripe-checkout';

    export default {
        name: "BasketView",
        components:{
            'StripeElements': StripeElements
        },
        data() {
            return {
                baskets: this.$store.state.baskets,
                orders: this.$store.state.orders,
                elements: this.$store.state.stripe.elements(),
                cardElement: null,
                currentPaymentIntent: null
            }
        },
        methods: {
            payForOrder: async function(uuid) {
                let postOrder = await this.$store.state.ticketrApi.postOrder(uuid);

                console.log(postOrder.status);

                switch(postOrder.status) {
                    case "requires_payment_method":
                        // Pay for order
                        this.cardElement = this.elements.create("card", {
                            style: {
                                base: {
                                    color: "#765CF2",
                                }
                            }
                        });
                        this.cardElement.mount("#basket-stripe-card-element");
                        this.currentPaymentIntent = postOrder.client_secret;
                        break;
                    default:
                        // Idk complain
                        break;
                }
            },
            submitPayment: async function() {
                this.$store.state.stripe.confirmCardPayment(this.currentPaymentIntent, {
                    payment_method: {
                        card: this.cardElement
                    },
                    setup_future_usage: 'off_session'
                }).then(function(result) {
                    if (result.error) {
                        // Show error to your customer
                        console.log(result.error.message);
                    } else {
                        if (result.paymentIntent.status === 'succeeded') {
                        // Show a success message to your customer
                        // There's a risk of the customer closing the window before callback execution
                        // Set up a webhook or plugin to listen for the payment_intent.succeeded event
                        // to save the card to a Customer

                        // The PaymentMethod ID can be found on result.paymentIntent.payment_method
                        }
                    }
                });
            }
        }
    }
</script>

<style scoped>
    .basket-container {
        color: #FFFFFF;
    }
</style>