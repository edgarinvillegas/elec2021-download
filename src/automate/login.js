const logger = require('../lib/logger');
const prompts = require('prompts');

const delay$ = delay => new Promise(res => setTimeout(res, delay));

async function login(page) {
    logger.log('Going to https://coxauto.service-now.com/time...');
    await page.goto('https://computo.oep.org.bo/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.dx-button[title="Descargar"]');
    return;
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