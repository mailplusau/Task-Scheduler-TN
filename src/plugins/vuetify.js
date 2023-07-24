import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        themes: {
            light: {
                primary: '#095c7b',
                secondary: '#eaf044',
                accent: '#103d39',
                error: '#b71c1c',
                background: '#cfe0ce',
            },
        },
    },
});
