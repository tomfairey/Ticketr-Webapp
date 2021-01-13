<template>
    <section class="input-container">
        <div class="input-content">
            <!-- <input type="text"> -->
            <v-text-field v-model="value" label="Username" placeholder="JohnDoe123"></v-text-field>
        </div>
    </section>
</template>

<script>
    export default {
        name: "TextInput",
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