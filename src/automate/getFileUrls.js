const dateFns = require('date-fns');

delete console.table;      // Node 8 console.table is noop.
require('console.table');

const logger = require('../lib/logger');

async function getFileUrls({ page  }){
    await page.click('.dx-button[title="Descargar"]')

    // Go to correct date. TODO: analyze supporting future targetDate
    {
        // logger.log(`Going to week "${targetDateText}"...`);

        const getCurrentDateText$ = () => page.getTextJq('.date-selector .date-range [role=heading]');

        async function weekBack$(){
            const dateText = await getCurrentDateText$();
            await page.click('.date-selector button.icon-chevron-left');
            await page.waitForJqSelector(`.date-selector:not(:contains(${dateText}))`)
        }
        while( !(await getCurrentDateText$()).startsWith(targetDateText) ){
            await weekBack$();
        }
    }
}


function getSuccessEmailSubject(emailSettings, targetDate){
    const saturdayDate = dateFns.format(dateFns.endOfWeek(targetDate), 'YYYY-MM-DD');
    return emailSettings.subjectTemplate.replace('{weekendDate}', saturdayDate);
}

function sendSuccessEmail$(mojixEmail, mojixPassword, emailSettings, targetDate, files) {
    //logger.log('emailSettings: ', emailSettings);

    return sendMail$({
        user: mojixEmail,
        pass: mojixPassword,
        to:   emailSettings.to,
        cc: emailSettings.cc,
        bcc: emailSettings.bcc,            // almost any option of `nodemailer` will be passed to it
        subject: getSuccessEmailSubject(emailSettings, targetDate),
        text:    `Timesheet has been submitted succesfully.`,         // Plain text
        //html:    '<b>html text</b>'            // HTML
        files: files,
    });
}


module.exports = getFileUrls;