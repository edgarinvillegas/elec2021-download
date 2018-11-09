const puppeteer = require('puppeteer');

const extendPageWithJQuery = require('./extendPageWithJQuery');

async function createBrowserAndPage(width = 1200, height = 768) {
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

module.exports = createBrowserAndPage;