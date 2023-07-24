<template>
    <v-dialog
        v-model="dialog"
        max-width="500"
        :persistent="globalModal.persistent"
    >
        <v-card class="background">
            <v-card-title :class="'text-h5' + (globalModal.isError ? ' red--text' : '')">
                <v-icon v-show="globalModal.isError" class="mr-2" color="red">mdi-alert-outline</v-icon>
                {{ globalModal.title }}
            </v-card-title>


            <v-card-text v-show="globalModal.busy" class="text-center">
                <v-progress-circular
                    :rotate="globalModal.progress >= 0 && globalModal.progress <= 100 ? -90 : 0"
                    :indeterminate="globalModal.progress < 0 || globalModal.progress > 100 || globalModal.progress === null"
                    :value="globalModal.progress"
                    color="primary"
                    size="45"
                >{{ (globalModal.progress >= 0 && 100 >= globalModal.progress) ? globalModal.progress + '%' : '' }}</v-progress-circular>
            </v-card-text>

            <v-card-text :class="globalModal.busy ? 'text-center' : ''" v-html="globalModal.body"></v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="green darken-1"
                    text
                    @click="dialog = false"
                    :disabled="globalModal.busy"
                >
                    Okay
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "GlobalNotificationModal",

    computed: {
        globalModal() {
            return this.$store.getters['globalModal'];
        },
        dialog: {
            get() {
                return this.globalModal.open;
            },
            set(val) {
                this.globalModal.open = val;
            }
        },
    }
}
</script>

<style scoped>

</style>