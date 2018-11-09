const dateFns = require('date-fns');

const sendMail$ = require('./lib/sendMail');
const logger = require('./lib/logger');

async function handleException(exc, browser, page, targetDate, cfg, credentials, headless = true ){
    console.log(exc.message);
    const screenshotFile = 'error.png';     // TODO: find out if ./ can be added
    await page.screenshot({ path: screenshotFile });
    logger.log(`FAILURE`);
    await sendExceptionMail$(exc, targetDate, cfg, credentials, `./${screenshotFile}`);
    console.log(`Sent error email to ${credentials.coxEmail}. Check ${screenshotFile}`);
    if(headless) {
        await browser.close();
        process.exit(exc.errorCode || 1);
    }
}

function sendExceptionMail$(exc, targetDate, cfg, credentials, screenshotFile) {
    const week = dateFns.format(dateFns.endOfWeek(targetDate), 'YYYY-MM-DD');
    const { mojixEmail, mojixPassword, coxEmail } = credentials;    // Store credentials before deletion.
    const cfgClone = JSON.parse(JSON.stringify(cfg));
    if(cfgClone.credentials) {
        cfgClone.credentials.mojixPassword = '***'
        cfgClone.credentials.coxPassword = '***'
    }
    return sendMail$({
        user: mojixEmail,
        pass: mojixPassword,
        to:   coxEmail,
        cc:  mojixEmail,
        subject: `ERROR. Error when submitting ${week} timesheet`,
        text:    `ERROR. Error when submitting ${week} timesheet.\nLog:\n${logger.getLogs().join('\n')}\n${exc.message}\nConfiguration:\n${JSON.stringify(cfgClone)}`,         // Plain text
        //html:    '<b>html text</b>'            // HTML
        files: [screenshotFile]
    });
}

module.exports = handleException;