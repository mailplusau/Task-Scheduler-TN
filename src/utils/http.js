import superagent from "superagent";
import store from "@/store";

function _getURL() {
    let currentUrl = parent['getCurrentNetSuiteUrl'] ? parent.getCurrentNetSuiteUrl() : window.location.href;
    let [baseUrl, queryString] = currentUrl.split('?');
    const params = new Proxy(new URLSearchParams(`?${queryString}`), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    let essentialParams = {script: params['script'], deploy: params['deploy']};
    let postEndpoint = baseUrl + '?' + new URLSearchParams(essentialParams).toString();

    return {baseUrl, essentialParams, postEndpoint}
}

export default {
    async get(operation, requestParams) {
        let {baseUrl, essentialParams} = _getURL();

        return new Promise((resolve, reject) => {
            superagent.get(baseUrl)
                .set("Content-Type", "application/json")
                .query({...essentialParams, requestData: JSON.stringify({operation, requestParams})})
                .end((err, res) => { _handle(err, res, reject, resolve); });
        });
    },
    async post(operation, requestParams) {
        let {postEndpoint} = _getURL();

        return new Promise((resolve, reject) => {
            superagent.post(postEndpoint)
                .set("Content-Type", "application/json")
                .set("Accept", "json")
                .send({operation, requestParams})
                .end((err, res) => { _handle(err, res, reject, resolve); });
        });
    }
}

function _handle(err, res, reject, resolve) {
    let errorMessage = err || (res.body?.error || null);

    if (errorMessage) {
        store.dispatch('handleException', {title: 'An error occurred', message: errorMessage}, {root: true}).then();
        reject(errorMessage);
    } else resolve(res.body);
}