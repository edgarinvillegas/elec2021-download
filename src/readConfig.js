const fs    = require('fs');
const nconf = require('nconf');

const logger = require('./lib/logger');

/**
 * Get the configuration object.
 * It reads from args/env/file and creates the file if it doesn't exist.
 * @returns {*}
 */
function readConfig() {
    logger.log('Reading configuration...');
    const conf_defaults = {
        "credentials": {
            "coxEmail": "YOUR_NAME@coxautoinc.com",
            "coxPassword": "",
            "mojixEmail": "YOUR_NAME@mojix.com",
            "mojixPassword": ""
        },
        "project": "PRJ0000000",
        "category": "Development",
        "defaultHours": {
            "monday": 8,
            "tuesday": 8,
            "wednesday": 8,
            "thursday": 8,
            "friday": 8
        },
        "exceptionalHours": {
            "2018-11-01": 0,
            "2017-12-31:2018-01-01": 0,
        },
        "emailSettings": {
            "to": ["cox_report@mojix.com"],
            "cc": ["LEAD_NAME@mojix.com"],
            "bcc": [],
            "subjectTemplate": "{weekendDate} 1234 PEREZ"
        }
    };

    const conf_file ='./config.json';
    if( ! fs.existsSync(conf_file) ) {
        fs.writeFileSync( conf_file, JSON.stringify(conf_defaults, null, 2) );
        logger.log(`Please edit ${conf_file} and rerun the application`);
        process.exit(1);
    }
    // nconf.file({file: conf_file});
    nconf.argv()
        // .env()
        .file({ file: conf_file })
        .defaults(conf_defaults);

    return nconf.get(null);
}

module.exports = readConfig;