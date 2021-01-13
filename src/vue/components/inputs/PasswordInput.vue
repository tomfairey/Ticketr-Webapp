<template>
    <section class="input-container">
        <div class="input-content">
            <!-- <input type="text"> -->
            <v-text-field v-model="value" type="password" label="Password"></v-text-field>
        </div>
    </section>
</template>

<script>
    export default {
        name: "PasswordInput",
        data() {
            return {
                value: ''
            }
        }
    }
</script>

<style>
    .input-content * {
        font-family: 'HK Grotesk';
    }
</style>