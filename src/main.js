const { readConfig, getExecTargetDate } = require('./config/readConfig');
const getWeekExecConfig = require('./config/getWeekExecConfig');
const createBrowserAndPage = require('./lib/createBrowserAndPage');
const handleException = require('./exceptionHandler');

const login = require('./automate/login');
const fillTimesheet = require('./automate/fillTimesheet');

async function main(){
    // Load configuration from file.
    const castCfg = readConfig();
    const credentials = castCfg.credentials;
    const headless = true;
    // Load the page
    const { page, browser } = await createBrowserAndPage(headless);
    let targetDate;
    try {
        targetDate = getExecTargetDate(castCfg.week);
        const weekExecConfig = getWeekExecConfig(castCfg, targetDate);
        await login(page, credentials.coxEmail, credentials.coxPassword);
        await fillTimesheet({
            page,
            cfg: weekExecConfig,
            credentials,
            targetDate,
            // TODO: make this overridable per week
            promptForConfirmation: !!castCfg.promptForConfirmation
        });
        await browser.close();
    } catch (exc) {
        const sendExceptionEmail = true;    // Set to false during development.
        await handleException(exc, browser, page, targetDate || new Date(), castCfg, credentials, headless, sendExceptionEmail);
    }
}

module.exports = main;