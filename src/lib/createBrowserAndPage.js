const puppeteer = require('puppeteer');

const extendPageWithJQuery = require('./extendPageWithJQuery');

async function createBrowserAndPage(headless = true, width = 1200, height = 1200) {
    const browser = await puppeteer.launch({
        headless: headless,
        args: [
            `--window-size=${ width },${ height }`
        ],
    });

    const page = extendPageWithJQuery(await browser.newPage());
    // Initial page
    await page.setViewport({width, height});
    return { page, browser };
}

module.exports = createBrowserAndPage;