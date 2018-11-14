const readConfig = require('./readConfig').readConfig;
const getExecConfig = require('./readConfig').getExecConfig;
const createBrowserAndPage = require('./lib/createBrowserAndPage');
const handleException = require('./exceptionHandler');

const login = require('./automate/login');
const fillTimesheet = require('./automate/fillTimesheet');

async function main(){
    // Load configuration from file.
    const rawCfg = readConfig();
    const credentials = rawCfg.credentials;
    const headless = true;
    // Load the page
    const { page, browser } = await createBrowserAndPage(headless);
    const targetDate = new Date();
    const execConfig = getExecConfig(rawCfg, targetDate);
    // console.log(JSON.stringify(execConfig, null, 2));
    try {
        await login(page, credentials.coxEmail, credentials.coxPassword);
        await fillTimesheet({
            page,
            cfg: execConfig,
            credentials,
            targetDate
        });
        await browser.close();
    } catch (exc) {
        const sendExceptionEmail = true;    // Set to false during development.
        await handleException(exc, browser, page, targetDate, rawCfg, credentials, headless, sendExceptionEmail);
    }
}

module.exports = main;