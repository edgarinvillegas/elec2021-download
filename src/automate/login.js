const logger = require('../lib/logger');
const prompts = require('prompts');

async function handleMfa(page) {
    try {
        // await page.click('.factors-dropdown-wrap a');
        await page.waitForSelector('.dropdown.more-actions a');
        /*
        mfa-okta-verify-30
        mfa-google-auth-30
        mfa-sms-30
        mfa-call-30
        */
        const mfaType = 'sms'
        // await page.click('.dropdown.more-actions a');
        // Because page.click isn't working
        const mfaTypeClassName = `mfa-${mfaType}-30`;
        await page.evaluate((mfaTypeClassName) => {
            document.querySelector('.dropdown.more-actions a').click();
            document.querySelector(`ul.okta-dropdown-list .option .${mfaTypeClassName}`).click();
        }, mfaTypeClassName);

        await page.waitForSelector('#okta-sign-in form .o-form-content .link-button');
        // No da el await page.click('#okta-sign-in form .o-form-content .link-button');
        //setTimeout(async() => await page.click('#okta-sign-in form .o-form-content .link-button'), 1000)
        await page.evaluate(() => {
            setTimeout(() => document.querySelector('#okta-sign-in form .o-form-content .link-button').click(), 1000);
        });
        const promptResults = await prompts({
            type: 'number',
            name: 'value',
            message: 'Enter MFA Code',
            //validate: value => value < 18 ? `Nightclub is 18+ only` : true
        });
        const code = String(promptResults.value);
        await page.type('#okta-sign-in form input[type=tel]', code);
        await page.click('#okta-sign-in form input[type=submit]');
        console.log('End try');
    } catch(exc) {
        console.log('NO SE HALLÓ DROPDOWN MFA', exc.message)
    }
}

async function login(page, coxEmail, coxPassword) {
    logger.log('Going to https://coxauto.service-now.com/time...');
    await page.goto('https://coxauto.service-now.com/time', {waitUntil: 'networkidle2'});
    // Login
    {
        // Some redirections might happen, so better to make sure that the username textbox exists
        await page.waitForSelector('#okta-signin-username');
        logger.log(`Logging in ${coxEmail}...`);
        // await page.screenshot({path: '01 login-page.png'});

        // Now we're on the login page. Enter credentials
        await page.type('#okta-signin-username', coxEmail);
        await page.type('#okta-signin-password', coxPassword);

        // Submit the form
        await page.click('input[type="submit"]');

        try {
            //We wait for the timesheet page if login was succesful
            const pageAfterLogin = await Promise.race([
                page.waitForSelector('.sp-page-root').then(() => 'home'),
                page.waitForSelector('.factors-dropdown-wrap').then(() => 'mfa')
            ]);
            console.log('pageAfterLogin: ', pageAfterLogin)
            if(pageAfterLogin === 'mfa') {
                await handleMfa(page);
            }

        } catch (exc) {     //Most likely it means there was a login error
            // We get the error message from UI. If not present, rethrow
            const errorMsg = await page.evaluate( () => {
                const errorElement = window.document.querySelector('.okta-form-infobox-error');
                return errorElement ? errorElement.innerText.trim() : null;
            });
            throw errorMsg ? new Error(`"${errorMsg}"\nPlease check your cox credentials`) : exc;
        }
    }

    // Go to timesheet page
    {
        // This will go to another page, wait until it loads
        await page.waitForSelector('.sp-page-root');

        logger.log(`Loading timesheet page...`);
        // The current page has the page we want as framed in. Let's go to it
        await page.goto('https://coxauto.service-now.com/time', {waitUntil: 'networkidle2'});

        await page.waitForSelector('.date-selector button.icon-chevron-left');
    }
}

module.exports = login;