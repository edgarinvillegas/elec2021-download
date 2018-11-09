function extendPageWithJQuery(page){
    return Object.assign(page, {
        /**
         * The page needs to have window.jQuery defined.
         * Equivalent to page.waitForSelector but admits jQuery selectors (like ':contains')
         * @returns {ReturnTypeOf<waitForSelector>}
         */
        waitForJqSelector: (selector, options = {}) => page.waitFor(
            (selector => window.jQuery(selector).length),
            options, selector),
        /**
         * The page needs to have window.jQuery defined.
         * page.triggerJqEvent('button#myBtn', 'mousedown')
         * @param {string} selector
         * @param {string} eventName
         * @returns {Promise<void>} Same promise as page.evaluate
         */
        triggerJqEvent: (selector, eventName) => page.evaluate((selector, eventName) => {
            window.jQuery(selector).trigger(eventName);
        }, selector, eventName),

        /**
         * Gets the trimmed text of a jq selector
         * @param {string} selector JQ Selector
         * @returns {string}
         */
        getTextJq: selector => page.evaluate(selector => window.jQuery(selector).text().trim(), selector)
    })
}

module.exports = extendPageWithJQuery;