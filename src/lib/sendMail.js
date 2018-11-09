const gmailSend = require('gmail-send');

/**
 * Promise wrapper for gmail-send
 * @param {Object} options Same object as gmail-send configuration
 * @returns {Promise<string>}
 */
function sendMail$(options) {
    const send = gmailSend(options);
    return new Promise( (resolve, reject) => {
        send({}, function (err, res) {
            console.log('Email attempt done. Err:', err, '; res:', res);
            if (err){
                reject(err);
            } else {
                resolve(res);
            }
        });
    })
}

module.exports = sendMail$;