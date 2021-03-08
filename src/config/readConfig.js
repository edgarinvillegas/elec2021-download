const fs    = require('fs');
const nconf = require('nconf');
const dateFns = require('date-fns');

const transformAndValidate = require('./transformAndValidate');
const logger = require('../lib/logger');

/**
 * Get the configuration object.
 * It reads from args/env/file and creates the file if it doesn't exist.
 * @returns {*}
 */
function readConfig() {
    if(process.argv.some(val => val === '--help')) {
        console.log('Please visit https://github.com/edgarinvillegas/cox-timesheet');
        process.exit(0);
    }

    logger.log('Reading configuration...');
    // const missingConfFiles = [];
    const old_config_file = './config.json';
    if( fs.existsSync(old_config_file) ) {
        logger.log(`${old_config_file} is deprecated. Please use config.js`);
    }

    let configFileJustCreated = false;
    let credentialsFileJustCreated = false;

    const conf_file ='./config.js';
    const conf_file_fullpath = process.cwd() + '/config.js';
    if( ! fs.existsSync(conf_file) ) {
        // fs.writeFileSync( conf_file, JSON.stringify(conf_defaults, null, 2) );
        const configBaseContents = fs.readFileSync(`${__dirname}/configBase.static.js`, 'utf8');
        fs.writeFileSync( conf_file, configBaseContents );
        configFileJustCreated = true;
        logger.log(`${conf_file} created in the current directory.`);
        // process.exit(1);
    }

    // We check if config.js imports credentials file. If so, create the file
    const credentials_file ='./credentials.json';
    const configContentsStr = fs.readFileSync(conf_file_fullpath, 'utf8');
    if( configContentsStr.includes(credentials_file) && !fs.existsSync(credentials_file) ) {
        const defaultCredentials =  {
            coxEmail: 'YOUR_NAME@coxautoinc.com',
            coxPassword: '',
            mojixEmail: 'YOUR_NAME@mojix.com',
            mojixPassword: ''
        };
        fs.writeFileSync( credentials_file, JSON.stringify(defaultCredentials, null, 2) );
        credentialsFileJustCreated = true;
        logger.log(`${credentials_file} created in the current directory.`);
    }
    if(configFileJustCreated || credentialsFileJustCreated) {
        logger.log(`Please edit the above file(s) and rerun the application`);
        process.exit(1);
    }

    // nconf.file({file: conf_file});
    const configJsObj = require(conf_file_fullpath);

    nconf.argv()
        .env()
        // .file({ file: conf_file })
        //.defaults(require('../config.js'));
        .defaults(configJsObj);

    const rawCfg = nconf.get(null);
    // Remove unneeded keys. Needed because environment variables are too many.
    Object.keys(rawCfg).forEach(key => {
        const whitelist = ['credentials', 'week', 'defaults', 'promptForConfirmation', 'zeroDays', 'weekOverrides', 'mfaType'];
        if(!whitelist.includes(key)) delete rawCfg[key];
    });

    return transformAndValidate(rawCfg);    //Will log and exit if validation errors are found
}

module.exports = { readConfig, getExecTargetDate };