const puppeteer = require('puppeteer');
const dateFns = require('date-fns');
const gmailSend = require('gmail-send');

const readConfig = require('./readConfig');
const extendPageWithJQuery = require('./extendPageWithJQuery');

let cfg = null;
let credentials = null;

async function createBrowserAndPage() {
    // Viewport && Window size
    const width = 1200;
    const height = 768;

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--window-size=${ width },${ height }`
        ],
    });

    const page = extendPageWithJQuery(await browser.newPage());
    // Initial page
    await page.setViewport({width, height});
    return { page, browser };
}

function transformAddTimecardPostData(originalPostData, hours) {
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
    Object.keys(hours).forEach( day => values.timecards[0][day] = String(hours[day]));
    // Encode back
    const valuesJsonStr = JSON.stringify(values);
    // console.log('new Values', valuesJsonStr);
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

function sendEmail(files) {
    console.log('emailSettings: ', cfg.emailSettings);
    const send = gmailSend({
        user: credentials.mojixEmail,
        pass: credentials.mojixPassword,
        // pass: credentials.pass,                  // Application-specific password
        to:   cfg.emailSettings.to,
        bcc: cfg.emailSettings.bcc,            // almost any option of `nodemailer` will be passed to it
        subject: cfg.emailSettings.subjectTemplate,
        text:    'funciona!!!',         // Plain text
        //html:    '<b>html text</b>'            // HTML
        files: files,
    });
    send({}, function (err, res) {
        console.log('Email attemp done. Err:', err, '; res:', res);
    });
}

async function automate(){
    const targetDate = new Date();
    // Load configuration from file.
    cfg = readConfig();
    credentials = cfg.credentials;
    console.log(credentials);
    // Load the page
    const { page, browser } = await createBrowserAndPage();
    await page.goto('https://coxauto.service-now.com/time', {waitUntil: 'networkidle2'});
    // Login
    {
        // Some redirections might happen, so better to make sure that the username textbox exists
        await page.waitForSelector('#okta-signin-username');
        await page.screenshot({path: '01 login-page.png'});

        // Now we're on the login page. Enter credentials
        await page.type('#okta-signin-username', credentials.coxEmail);
        await page.type('#okta-signin-password', credentials.coxPassword);

        // Submit the form
        await page.click('input[type="submit"]');
    }

    // Go to timesheet page
    {
        // This will go to another page, wait until it loads
        await page.waitForSelector('.navpage-layout');

        // The current page has the page we want as framed in. Let's go to it
        await page.goto('https://coxauto.service-now.com/time', {waitUntil: 'networkidle2'});

        await page.waitForSelector('.date-selector button.icon-chevron-left');
    }

    // Go to correct date
    {
        //************************************* Go temporarily to previous page
        const targetDateTextStart = getWeekPickerText(targetDate);

        const getCurrentDateText$ = () => page.getTextJq('.date-selector .date-range [role=heading]');

        async function weekBack$(){
            const dateText = await getCurrentDateText$();
            await page.click('.date-selector button.icon-chevron-left');
            await page.waitForJqSelector(`.date-selector:not(:contains(${dateText}))`)
        }
        while( !(await getCurrentDateText$()).startsWith(targetDateTextStart) ){
            await weekBack$();
        }
    }

    // Check timesheet status. If not PENDING, abort.
    {
        //It can be PENDING, SUBMITED, PROCESSED
        const timesheetState = (await page.getTextJq('.tcp-header .ts-data:contains(State) .ts-val')).toUpperCase();
        if(timesheetState !== 'PENDING') {
            console.log(`No need to submit timesheet "${getWeekPickerText(targetDate)}" because it's in ${timesheetState} state`);
            process.exit(0);
        }
    }

    // Timesheet filling
    {
        async function getLoggedHours$() {
            return await page.evaluate(() => {
                return window.jQuery('#cal-container-1 .cal-container-4').map( (i, e) => parseInt($(e).text().trim()) ).get();
            });
        }

        async function getHourDifference$() {
            // Get the total accumulated hours by day. Useful for validation. Won't be needed once we implement pre cleanup
            const actualTotalDailyHours = await getLoggedHours$()
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const actualTotalDailyHoursObj = {}, differences = {};
            days.forEach( (day, i) =>  {
                actualTotalDailyHoursObj[day] = actualTotalDailyHours[i];
                differences[day] = (cfg.defaultHours[day] || 0) - actualTotalDailyHoursObj[day];
            });
            if(!Object.values(differences).every( h => h >= 0 )){
                console.log('Error. Intended hours: ', cfg.defaultHours, '\nCurrently logged: ', actualTotalDailyHoursObj, '.\nPlease submit your timesheet manually');
            }
            return differences;
        }

        const hourDifferences = await getHourDifference$();
        // If there's a negative difference, it means we cannot submit it. TODO: Add automatic timesheet wipe to avoid this
        if(Object.values(hourDifferences).some( h => h < 0 )) {
            await page.screenshot({path: '06 Error - Times dont match.png'});
            process.exit(3);
        } else if (Object.values(hourDifferences).every( h => h === 0)) {
            console.log('Already logged desired hours. Skipping logging');
        } else {
            // Just in case wait for the project cards container
            await page.waitForSelector('.cards-panel-body');
            await page.screenshot({path: '02 final-page.png'});

            // Wait until we have the 'Add Line' button
            const projectCardSelector = `.card:contains(${cfg.project})`;
            const addLineBtnSelector = `${projectCardSelector} button:contains(Add Line Item)`;

            // Click on the Add Line button
            await page.waitForJqSelector(addLineBtnSelector);
            await page.triggerJqEvent(addLineBtnSelector, 'click');
            await page.screenshot({path: '03 Add Line clicked.png'});

            // Wait until the 'Select time category' dropdown appears
            const categoryDropdownSelector = `${projectCardSelector} .select2-container.project-category`;
            // Click on the 'Select time category' dropdown, and get the projectId
            await page.waitForJqSelector(`${categoryDropdownSelector} .select2-arrow`);
            await page.triggerJqEvent(`${categoryDropdownSelector} .select2-arrow`, 'mousedown');

            // Wait until the dropdown opens
            await page.waitForSelector('ul.select2-results li.select2-result-selectable');
            await page.screenshot({path: '04 Select category dropdown opened.png'});
            // Click on the configured time category
            await page.triggerJqEvent(`ul.select2-results li.select2-result-selectable div:contains(${cfg.category})`, 'mouseup');
            await page.screenshot({path: '04 Select category dropdown opened.png'});
            // Start request interception to spoof hours
            await page.setRequestInterception(true);
            page.on('request', interceptedRequest => {
                if (interceptedRequest.url().includes('/timecardprocessor.do?sysparm_name=addToTimesheet&sysparm_processor=TimeCardPortalService')){
                    console.log('Intercepted /timecardprocessor.do');
                    interceptedRequest.continue({
                        postData: transformAddTimecardPostData(interceptedRequest.postData(), hourDifferences)
                    });
                } else {
                    interceptedRequest.continue();
                }
            });
            // Click on the 'Add Time' button
            await page.triggerJqEvent(`${projectCardSelector} button.btn-primary:contains(Add Time)`, 'click');
            // Make sure the row was added
            await page.waitForSelector(`.tc-row`);
            await page.screenshot({path: '05 Timecard added.png'});
        }

        console.log('Ready to submit!!');
        // await page.triggerJqEvent('.sp-row-content button.btn-primary:contains(Submit)', 'click');
        // await page.waitForJqSelector('.sp-row-content a:contains(PDF)');
        const finalScreenshot = '07 Submitted.png';
        await page.screenshot({path: finalScreenshot});
        sendEmail([`./${finalScreenshot}`]);
        console.log('Done');
    }
    // await browser.close();
};

module.exports = automate;