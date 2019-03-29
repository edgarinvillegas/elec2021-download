const logger = require('../lib/logger');

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
            await page.waitForSelector('.sp-page-root');
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