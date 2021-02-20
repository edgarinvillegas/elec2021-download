const logger = require('../lib/logger');
const prompts = require('prompts');

const delay$ = delay => new Promise(res => setTimeout(res, delay));

async function handleMfa(page, rawMfaType) {
    try {
        // await page.click('.factors-dropdown-wrap a');
        await page.waitForSelector('.dropdown.more-actions a');
    } catch(exc) {
        throw new Error(`Could not find MFA dropdown.\n${exc.message}`);
    }
    /*
    mfa-okta-verify-30
    mfa-google-auth-30
    mfa-sms-30
    mfa-call-30
    */
    const mfaTypes = ['okta-verify', 'google-auth', 'sms', 'call'];
    let mfaType = mfaTypes.find(t => t.toLowerCase().includes(rawMfaType.trim().toLowerCase()));
    if(!mfaType) {
        logger.log(`MFA type "${rawMfaType}" not found. Defaulting to SMS`);
        mfaType = 'sms';
    }
    logger.log(`Using MFA type "${mfaType}"`);
    if(['sms', 'okta-verify'].includes(mfaType)) {
        // Because page.click('.dropdown.more-actions a') isn't working
        const mfaTypeClassName = `mfa-${mfaType}-30`;
        await page.evaluate((mfaTypeClassName) => {
            document.querySelector('.dropdown.more-actions a').click();
            document.querySelector(`ul.okta-dropdown-list .option .${mfaTypeClassName}`).click();
        }, mfaTypeClassName);
        await delay$(1000); // Wait until dropdown is clicked. TODO test removing it.
        if(mfaType === 'sms') {
            await page.waitForSelector('#okta-sign-in form .o-form-content .link-button');
            // No da el await page.click('#okta-sign-in form .o-form-content .link-button');
            //setTimeout(async() => await page.click('#okta-sign-in form .o-form-content .link-button'), 1000)
            await page.evaluate(() => {
                setTimeout(() => document.querySelector('#okta-sign-in form .o-form-content .link-button').click(), 1000);
            });
            const promptResults = await prompts({
                type: 'text',
                name: 'value',
                message: 'Enter MFA code sent to you by SMS',
            });
            const code = String(promptResults.value);
            await page.type('#okta-sign-in form input[type=tel]', code);
        } else if (mfaType === 'okta-verify') {
            await page.waitForSelector('#okta-sign-in form.mfa-verify-push', { visible: true }); // Probably with visibility the await(1000) isn't needed
            const deviceName = await page.evaluate(() => document.querySelector('#okta-sign-in form .okta-form-title').innerText.trim());
            logger.log(`Please accept auth request push on ${deviceName}. Waiting (3 minutes)...`);

        }
        await page.click('#okta-sign-in form input[type=submit]');
    } else {
        throw new Error(`Sorry, only SMS and OKTA are supported for MFA for now. Support for other methods coming on request`);
    }
}

async function login(page, coxEmail, coxPassword, mfaType) {
    logger.log('Going to https://coxauto.service-now.com/time...');
    await page.goto('https://coxauto.service-now.com/time', { waitUntil: 'networkidle2', timeout: 60000 });
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

        let pageAfterLogin;
        try {
            //We wait for the timesheet page if login was succesful
            pageAfterLogin = await Promise.race([
                page.waitForSelector('.sp-page-root').then(() => 'home'),
                page.waitForSelector('.factors-dropdown-wrap').then(() => 'mfa')
            ]);

        } catch (exc) {     //Most likely it means there was a login error
            // We get the error message from UI. If not present, rethrow
            const errorMsg = await page.evaluate( () => {
                const errorElement = window.document.querySelector('.okta-form-infobox-error');
                return errorElement ? errorElement.innerText.trim() : null;
            });
            throw errorMsg ? new Error(`"${errorMsg}"\nPlease check your cox credentials`) : exc;
        }
        if(pageAfterLogin === 'mfa') {
            await handleMfa(page, mfaType);
        }
    }

    // Go to timesheet page
    {
        // This will go to another page, wait until it loads. Big timeout because we might be waiting for user to accept the push
        // TODO: Consider moving this timeout to handleMfa()
        await page.waitForSelector('.sp-page-root', { timeout: 180000 });

        logger.log(`Loading timesheet page...`);
        // The current page has the page we want as framed in. Let's go to it
        await page.goto('https://coxauto.service-now.com/time', {waitUntil: 'networkidle2'});

        await page.waitForSelector('.date-selector button.icon-chevron-left');
    }
}

module.exports = login;