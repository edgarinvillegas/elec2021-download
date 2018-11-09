const automate = require('./automate');
const readConfig = require('./readConfig');
const createBrowserAndPage = require('./lib/createBrowserAndPage');
const handleException = require('./exceptionHandler');

async function main(){
    // Load configuration from file.
    const cfg = readConfig();
    const credentials = cfg.credentials;
    const headless = true;
    // Load the page
    const { page, browser } = await createBrowserAndPage(headless);
    const targetDate = new Date();
    try {
        await automate({
            page,
            cfg,
            credentials,
            targetDate
        });
        await browser.close();
    } catch (exc) {
        const sendExceptionEmail = true;    // Set to false during development.
        await handleException(exc, browser, page, targetDate, cfg, credentials, headless, sendExceptionEmail);
    }
}

module.exports = main;