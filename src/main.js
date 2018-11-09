const automate = require('./automate');
const readConfig = require('./readConfig');
const createBrowserAndPage = require('./lib/createBrowserAndPage');

async function main(){
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
}

module.exports = main;