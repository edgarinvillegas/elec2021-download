const automate = require('./src/automate');
const readConfig = require('./src/readConfig');
const createBrowserAndPage = require('./src/lib/createBrowserAndPage');

(async function main(){
    // Load configuration from file.
    const cfg = readConfig();
    const credentials = cfg.credentials;
    // Load the page
    const { page, browser } = await createBrowserAndPage();
    await automate({
        browser,
        page,
        cfg,
        credentials
    });
})();