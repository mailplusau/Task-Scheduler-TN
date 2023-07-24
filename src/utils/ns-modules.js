let NS_MODULES;
let retryCount = 0;

export default function () {
    return new Promise((resolve, reject) => {
        if (NS_MODULES) resolve(NS_MODULES);
        else {
            let appTimer = setInterval(() => { // Since NetSuite's client script does not get loaded immediately, we have to wait for it.
                retryCount++;
                if (window._getClientModules) {
                    NS_MODULES = window._getClientModules();
                    clearInterval(appTimer);
                    resolve(NS_MODULES);
                } else if (retryCount >= 10) {
                    clearInterval(appTimer);
                    reject('Could not load NS Modules');
                }
            }, 250);
        }
    });
}