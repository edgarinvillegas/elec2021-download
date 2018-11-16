const dateFns = require('date-fns');

const weekdayNames = require('../constants').weekdayNames;
const logger = require('../lib/logger');
const sendMail$ = require('../lib/sendMail');

async function fillTimesheet({ page, cfg, credentials, targetDate }){
    // Go to correct date. TODO: analyze supporting future targetDate
    {
        const targetDateText = getWeekPickerText(targetDate);
        logger.log(`Going to week "${targetDateText}"...`);

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

    // Check timesheet status. If not PENDING, abort.
    {
        //It can be PENDING, SUBMITED, PROCESSED
        const timesheetState = (await page.getTextJq('.tcp-header .ts-data:contains(State) .ts-val')).toUpperCase();
        if(timesheetState !== 'PENDING') {
            // TODO: analyze if this should throw
            throw new Error(`No need to submit timesheet "${getWeekPickerText(targetDate)}" because it's in ${timesheetState} state`);
        }
    }

    // Timesheet filling
    {
        logger.log(`Filling timesheet...`);
        // Just in case wait for the project cards container
        await page.waitForSelector('.cards-panel-body');
        await page.waitForSelector('#tc-grid');

        await logRows(page, cfg.projectHours, cfg.workingDays);

        const totalHoursLogged = parseInt(await page.getTextJq('.tcp-header .ts-data:contains(Total) .ts-val'));
        /*const expectedTotal = Object.values(cfg.projectHours).map( prjData => prjData.hours ).reduce( (tot, hours ) => {
            return tot + hours.reduce( (st, h) => st + h );
        });
        */
        const expectedTotal = Object.values(cfg.projectHours)
            .map( prjData => prjData.hours.reduce( (t, h) => t+h) )    //Total by row
            .reduce( (t, rowTotal ) => t + rowTotal )
        ;
        if(totalHoursLogged != expectedTotal) {
            throw new Error(`The intended total hours were ${expectedTotal}, but finally you have ${totalHoursLogged}.`+
                ` This is because you already had projects logged. Please remove them manually and retry`)
        }


        logger.log('Ready to submit...');
        // return; // Uncomment this to avoid submission

        await page.triggerJqEvent('.sp-row-content button.btn-primary:contains(Submit)', 'click');
        await page.waitForJqSelector('.sp-row-content a:contains(PDF)');
        logger.log('Submitted succesfully.');
        //
        const finalScreenshot = 'submitted.png';
        await page.screenshot({path: finalScreenshot});
        logger.log(`Sending success emails...`);
        await sendSuccessEmail$(credentials.mojixEmail, credentials.mojixPassword, cfg.emailSettings, targetDate, [`./${finalScreenshot}`]);
        logger.log('SUCCESS.');
    }
}

async function getRowAlreadyLoggedHours(page, projectId, categoryLabel) {
    //await page.waitForJqSelector(`#tc-grid .tc-row:contains(${projectId}):contains(${categoryLabel})`);
    const alreadyLoggedHours = await page.evaluate((projectId, categoryLabel, weekdayNames) => {
        return window.jQuery(`#tc-grid .tc-row:contains(${projectId}):contains(${categoryLabel}) td`)
            .filter( (i,e) => weekdayNames.indexOf($(e).attr('data-field')) >= 0 )     // Get only the weekday columns
            .map( (i, e) => Number($(e).text()) )   // Get the cell contents as number
            .get()
        ;
    }, projectId, categoryLabel, weekdayNames);
    return alreadyLoggedHours.length > 0 ? alreadyLoggedHours : weekdayNames.map( () => 0 );
}

async function logRows(page, projectHours, workingDays) {
    // Aux variables for the request interceptor closure
    let auxHoursToLog = null;
    let auxNotes = null;

    // Set the request interceptor. TODO: Make this work inside logRow
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        // console.log('INTERCEPTING REQUEST...');
        if (interceptedRequest.url().includes('/timecardprocessor.do?sysparm_name=addToTimesheet&sysparm_processor=TimeCardPortalService')){
            // console.log('Intercepted for ', auxIntendedHours, auxNotes)
            // logger.log('Intercepted /timecardprocessor.do');
            interceptedRequest.continue({
                postData: transformAddTimecardPostData(interceptedRequest.postData(), auxHoursToLog, auxNotes)
            });
        } else {
            interceptedRequest.continue();
        }
    });

    for(const prjKey in projectHours) {
        logger.log(`--Processing row ${prjKey}...`);
        const projectId = prjKey.split('/')[0].trim();
        const categoryCode = prjKey.split('/')[1].trim();
        const categoryLabel = [
            'Planning',
            'Development',
            'Bug Fixes',
            'Maintenance and Support'
        ].find( label =>  label.toUpperCase().startsWith(categoryCode)) || 'Development';
        const projectObj = projectHours[prjKey];
        const intendedHours = {};
        workingDays.forEach( (day, i) => {
            intendedHours[day] = projectObj.hours[i];
        });
        logger.log(`Attempting to log ${JSON.stringify(intendedHours)}`);
        // await page.waitForJqSelector(`#tc-grid .tc-row:contains(${projectId}):contains(${categoryLabel})`);
        const rowAlreadyLoggedHours = await getRowAlreadyLoggedHours(page, projectId, categoryLabel);
        const remainingHours = {};
        weekdayNames.forEach( (day, i) => {
            remainingHours[day] = (intendedHours[day] || 0) - rowAlreadyLoggedHours[i];
        });
        const notes = projectObj.notes

        // These are just aux variables for the request interception closure
        auxHoursToLog = remainingHours;
        auxNotes = notes;

        if(Object.values(remainingHours).some( h => h > 0 || h < 0)) {
            if(rowAlreadyLoggedHours.some( h => h > 0)){
                logger.log(`Hours already logged: ${JSON.stringify(rowAlreadyLoggedHours)}. Logging remaining: ${JSON.stringify(remainingHours)}...`);
            }
            if(Object.values(remainingHours).some( h => h < 0)){
                throw new Error('Cannot log negative hours. Please fix current logged hours manually');
            } else {
                await logRow(page, projectId, categoryLabel, remainingHours, notes);
            }
        } else {
            logger.log(`Desired hours were already logged for ${projectId} / ${categoryLabel}. Skipping`);
        }
    }

}

async function logRow(page, projectId, categoryLabel, intendedHours, notes) {
    // await page.screenshot({path: '02 final-page.png'});

    // Wait until we have the 'Add Line' button
    logger.log(`Selecting project ${projectId}...`);
    const projectCardSelector = `.card:contains(${projectId})`;
    const addLineBtnSelector = `${projectCardSelector} button:contains(Add Line Item)`;

    // Click on the Add Line button
    await page.waitForJqSelector(addLineBtnSelector);
    await page.triggerJqEvent(addLineBtnSelector, 'click');
    // await page.screenshot({path: '03 Add Line clicked.png'});

    // Wait until the 'Select time category' dropdown appears
    logger.log(`Selecting category ${categoryLabel}...`);
    const categoryDropdownSelector = `${projectCardSelector} .select2-container.project-category`;
    // Click on the 'Select time category' dropdown, and get the projectId
    await page.waitForJqSelector(`${categoryDropdownSelector} .select2-arrow`);
    await page.triggerJqEvent(`${categoryDropdownSelector} .select2-arrow`, 'mousedown');

    // Wait until the dropdown opens
    await page.waitForSelector('ul.select2-results li.select2-result-selectable');
    // await page.screenshot({path: '04 Select category dropdown opened.png'});
    // Click on the configured time category
    await page.triggerJqEvent(`ul.select2-results li.select2-result-selectable div:contains(${categoryLabel})`, 'mouseup');
    // await page.screenshot({path: '04 Select category dropdown opened.png'});
    // Start request interception to spoof hours
    logger.log(`Logging hours to have ${JSON.stringify(intendedHours)}...`);
    // Click on the 'Add Time' button
    await page.triggerJqEvent(`${projectCardSelector} button.btn-primary:contains(Add Time)`, 'click');
    // The request has been already set to be intercepted
    // Make sure the row was added
    await page.waitForJqSelector(`#tc-grid .tc-row:contains(${projectId}):contains(${categoryLabel})`);
    //page.removeListener('request', requestListener);
    //await page.setRequestInterception(true);
    logger.log('Row added succesfully');
    // await page.screenshot({path: '05 Timecard added.png'});
}

function sendSuccessEmail$(mojixEmail, mojixPassword, emailSettings, targetDate, files) {
    //logger.log('emailSettings: ', emailSettings);
    const saturdayDate = dateFns.format(dateFns.endOfWeek(targetDate), 'YYYY-MM-DD');
    return sendMail$({
        user: mojixEmail,
        pass: mojixPassword,
        to:   emailSettings.to,
        cc: emailSettings.cc,
        bcc: emailSettings.bcc,            // almost any option of `nodemailer` will be passed to it
        subject: emailSettings.subjectTemplate.replace('{weekendDate}', saturdayDate),
        text:    `Timesheet for ${saturdayDate} has been submitted succesfully.`,         // Plain text
        //html:    '<b>html text</b>'            // HTML
        files: files,
    });
}

function transformAddTimecardPostData(originalPostData, hours, notes) {
    //Decode originalPostData
    const urlEncodedValuesComponent = originalPostData.split('values=')[1];
    const values = JSON.parse(decodeURIComponent(urlEncodedValuesComponent));
    /*
    values looks like:
    {
        "timecards": [
            {
                "monday": "8",
                "tuesday": "8",
                "wednesday": "8",
                "thursday": "8",
                "friday": "8",
                "notes": "These are my notes",
                "time_sheet": "37274231db61ab40b94169c3ca961995",
                "category": "task_work",
                "task": "e0dfbc03db2cef406062dff648961958",
                "project_time_category": "9e7e8b024f20cf0027ac04c85210c702"
            }
        ],
        "timesheetId": "37274231db61ab40b94169c3ca961995",
        "action": "quick_add"
    }
    */
    //Update each day hours based on the config. It modifies values
    if(notes) {
        values.timecards[0].notes = String(notes);
    }
    Object.keys(hours).forEach( day => values.timecards[0][day] = String(hours[day]));
    // Encode back
    const valuesJsonStr = JSON.stringify(values);
    // logger.log('new Values', valuesJsonStr);
    return `values=${encodeURIComponent(valuesJsonStr)}`;
}

function getWeekPickerText(date = new Date()){
    const startDate = dateFns.startOfWeek(date);
    const endDate = dateFns.endOfWeek(date);
    const [startYear, startMonth, startDay] = dateFns.format(startDate, 'YYYY MMMM D').split(' ');
    const [endYear, endMonth, endDay] = dateFns.format(endDate, 'YYYY MMMM D').split(' ');
    /*
    * 3 scenarios to support:
    * 18 - 24 November 2018
    * 25 November - 1 December 2018
    * 30 December 2018 - 5 January 2019
    * */
    const startMonthUI = startMonth === endMonth ? '' : `${startMonth} `;
    const startYearUI = startYear === endYear ? '': `${startYear} `;
    return `${startDay} ${startMonthUI}${startYearUI}- ${endDay} ${endMonth} ${endYear}`;
}

module.exports = fillTimesheet;