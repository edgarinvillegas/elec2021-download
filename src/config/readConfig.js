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
    logger.log('Reading configuration...');
    // const missingConfFiles = [];
    const old_config_file = './config.json';
    if( fs.existsSync(old_config_file) ) {
        logger.log(`${old_config_file} is deprecated. Please use config.js`);
    }

    const conf_file ='./config.js';
    const conf_file_fullpath = process.cwd() + '/config.js';
    if( ! fs.existsSync(conf_file) ) {
        // fs.writeFileSync( conf_file, JSON.stringify(conf_defaults, null, 2) );
        const configBaseContents = fs.readFileSync(`${__dirname}/configBase.static.js`, 'utf8');
        fs.writeFileSync( conf_file, configBaseContents );
        logger.log(`${conf_file} created in the current directory. Please edit it and rerun the application`);
        process.exit(1);
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
        logger.log(`${credentials_file} created in the current directory. Please *add your credentials* there and rerun the application`);
        process.exit(1);
    }
    // nconf.file({file: conf_file});
    const configJsObj = require(conf_file_fullpath);

    nconf.argv()
        // .env()
        // .file({ file: conf_file })
        //.defaults(require('../config.js'));
        .defaults(configJsObj);

    const rawCfg = nconf.get(null);
    return transformAndValidate(rawCfg);    //Will log and exit if validation errors are found
}

function getExecTargetDate(rawWeek, baseDate = new Date()) {
    if(typeof(rawWeek) === 'number' || rawWeek == Number(rawWeek)){
        if(rawWeek > 0) throw new Error('config.week cannot be positive yet. Enter a number equal or lower to 0')
        return dateFns.addWeeks(baseDate, Number(rawWeek));
    }
    if(typeof(rawWeek) === 'string') {
        return dateFns.parse(rawWeek);
    }
    return baseDate;
}


module.exports = { readConfig, getExecTargetDate };