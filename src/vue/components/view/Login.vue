<template>
    <section class="login-container">
        <div class="logo-content">
            <Logo></Logo>
        </div>
        <div class="login-content">
            <v-alert v-if="errorMessage" type="error">{{ errorMessage }}</v-alert>
            <v-alert v-if="firstName" type="error">Welcome back, {{ firstName }}!</v-alert>
            <div class="login-items-container" v-if="formVisibile">
                <v-form @submit.prevent="attemptAuthentication">
                    <div class="login-item-container">
                        <div class="login-item">
                            <v-text-field v-model="formData.username" autocomplete="username" label="Username" placeholder="JohnDoe123"></v-text-field>
                        </div>
                    </div>
                    <div class="login-item-container">
                        <div class="login-item">
                            <v-text-field v-model="formData.password" autocomplete="password" type="password" label="Password"></v-text-field>
                        </div>
                    </div>
                    <div class="login-item-container">
                        <div class="login-item">
                            <v-btn :disabled="formDisabled" block color="var(--color-accent)" type="submit">Login</v-btn>
                        </div>
                    </div>
                    <div class="login-item-container">
                        <div class="login-item">
                            <v-btn :disabled="formDisabled" color="#FFFFFF">
                                <v-icon>mdi-google</v-icon>
                            </v-btn>
                        </div>
                        <div class="login-item">
                            <v-btn :disabled="formDisabled" color="#FFFFFF">
                                <v-icon>mdi-twitter</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </v-form>
            </div>
        </div>
        <div class="profile-content">
            <div class="profile-items-container" v-if="profileSelectionVisibile">
                <div class="headings">
                    <div class="heading">Ticketr</div>
                    <div class="subheading">Knock, knock. Who's there?</div>
                </div>
                <div class="login-item-container" v-for="(profile, profileIndex) in profiles" :key="profileIndex">
                    <div class="login-item" @click="selectProfile(profile)">
                        <div class="profile" :style="`--profile-colour: ${profile.colour};`">
                            <div class="colour">{{ profile.name.split("")[0].toUpperCase() }}</div>
                            <div class="name">{{ profile.name }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
    import Logo from '../text/Logo.vue';
    import Title from '../text/Title.vue';

    export default {
        name: "Login",
        components: {
            'Logo': Logo,
            'Title': Title
        },
        data() {
            return {
                formDisabled: false,
                errorMessage: false,
                formVisibile: true,
                formData: {
                    username: '',
                    password: ''
                },
                profileSelectionVisibile: false,
                firstName: null,
                authAttempt: null
            }
        },
        computed: {
            profiles: function() {
                if(this.authAttempt.user) {
                    return this.authAttempt.user.profiles;
                } else {
                    return [];
                }
            }
        },
        methods: {
            attemptAuthentication: async function() {
                let authAttempt;
                try {
                    this.formDisabled = true;
                    if(!this.formData.username) {
                        throw new Error("Empty username")
                    }
                    if(!this.formData.password) {
                        throw new Error("Empty password")
                    }
                    authAttempt = await this.$store.state.ticketrApi.getAuthentication(this.formData.username, this.formData.password);
                    this.authAttempt = authAttempt;
                } catch(e) {
                    this.errorMessage = e.message;
                } finally {
                    this.formDisabled = false;
                    if(authAttempt) {
                        this.firstName = authAttempt.user.firstName;
                    };
                }
                try {
                    await this.$store.state.ticketrApi.getProfile(true);
                    setTimeout(() => {
                        this.$emit("postAuthentication", this.authAttempt);
                    }, 2000);
                } catch(e) {
                    if(e.hasOwnProperty('code') && e.code == "PROFILE_REQUIRED") {
                        this.toggleFormVisibility(false);
                        this.toggleProfileSelectionVisibility(true);
                    } else {
                        console.warn(e);
                    }
                }
            },
            selectProfile: async function(profile) {
                let authAttempt;
                try {
                    await this.$store.state.ticketrApi.setProfile(profile)
                    this.authAttempt.profile = profile;
                } catch(e) {
                    console.warn(e);
                } finally {
                    setTimeout(() => {
                        this.$emit("postAuthentication", this.authAttempt);
                    }, 2000);
                }
            },
            toggleFormVisibility: function(bool = !this.formVisibile) {
                this.formVisibile = bool;
            },
            toggleProfileSelectionVisibility: function(bool = !this.profileSelectionVisibile) {
                this.profileSelectionVisibile = bool;
            }
        }
    }
</script>

<style scoped>
    .login-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: var(--color-accent);
        width: 100%;
        height: 100%;
    }
    .logo-content {
        display: flex;
        position: relative;
        flex-grow: 1;
        min-width: 100%;
        justify-content: center;
        align-items: center;
    }
    .login-content {
        display: flex;
        position: relative;
        flex-direction: column;
        flex-shrink: 1;
        min-width: 100%;
        font-family: var(--primary-font);
    }
    .login-items-container {
        display: flex;
        position: relative;
        flex-direction: column;
        padding: 34px 24px;
        justify-self: flex-end;
        background-color: #FFFFFF;
        border-radius: 54% 46% 0 0 / 8% 12% 0 0;
    }
    .login-items-container .login-item-container:nth-of-type(4) {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 12px;
    }
    .login-items-container .login-item-container:nth-of-type(4) .login-item {
        display: flex;
        margin: 0 8px;
    }
    .login-items-container .login-item-container:nth-of-type(4) .login-item > * {
        border: 4px var(--color-accent) solid !important;
        min-width: 48px !important;
        min-height: 48px !important;
        padding: 0 !important;
    }
    .profile-items-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        position: absolute;
        padding: 34px 24px;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: #FFFFFF;
    }
    .profile-items-container .headings {
        padding: 0 0 20px 0;
    }
    .profile-items-container .headings .heading, .profile-items-container .headings .subheading {
        font-family: var(--primary-font);
        font-weight: 900;
        font-size: 96px;
        text-align: center;
        color: var(--color-accent);
    }
    .profile-items-container .headings .subheading {
        font-size: 24px;
    }
    .profile-items-container .login-item-container {
        flex: 50%;
    }
    .profile {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100px;
        margin: 4px;
        padding: 8px;
        border-radius: 6px;
        transition: background-color 0.2s ease-in-out;
    }
    .profile:hover {
        background-color: rgba(0,0,0,0.1);
    }
    .profile .colour {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 6px;
        width: 100px;
        height: 100px;
        background-color: var(--profile-colour);
        font-family: 'HK Grotesk';
        font-weight: 600;
        font-size: 52px;
        color: #FFFFFF;
    }
    .profile .name {
        /* margin: 0 0 0 10px; */
        font-family: var(--primary-font);
        font-size: 24px;
        font-weight: 800;
        color: #444444;
        padding: 10px;
    }
</style>