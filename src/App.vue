<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <h1>Main Contents</h1>
        </v-main>

        <GlobalNotificationModal />
    </v-app>
</template>

<script>
import GlobalNotificationModal from "@/components/GlobalNotificationModal";

export default {
    name: 'App',
    components: {
        GlobalNotificationModal,
    },
    created() {
        this.$store.dispatch('init');
    },
    computed:{
        theme(){
            return (this.$vuetify.theme.dark) ? 'dark' : 'light'
        }
    }
};
</script>
