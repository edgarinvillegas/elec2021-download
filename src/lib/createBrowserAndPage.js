const puppeteer = require('puppeteer');

const extendPageWithJQuery = require('./extendPageWithJQuery');

async function createBrowserAndPage(headless = true, width = 1200, height = 1000) {
    const browser = await puppeteer.launch({
        headless: headless,
        args: [
            `--window-size=${ width },${ height }` + (process.platform === 'linux' ? ' --no-sandbox --disable-setuid-sandbox' : '')
        ],
    });

    const page = extendPageWithJQuery(await browser.newPage());
    // Initial page
    await page.setViewport({width, height});
    return { page, browser };
}

module.exports = createBrowserAndPage;