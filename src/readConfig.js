const fs    = require('fs');
const nconf = require('nconf');
const dateFns = require('date-fns');

const logger = require('./lib/logger');

/**
 * Get the configuration object.
 * It reads from args/env/file and creates the file if it doesn't exist.
 * @returns {*}
 */
function readConfig() {
    logger.log('Reading configuration...');
    const credentials_file ='./credentials.json';
    // const missingConfFiles = [];
    const old_config_file = './config.json';
    if( fs.existsSync(old_config_file) ) {
        logger.log(`${old_config_file} is deprecated. Please use config.js`);
    }

    if( ! fs.existsSync(credentials_file) ) {
        const defaultCredentials =  {
            coxEmail: 'YOUR_NAME@coxautoinc.com',
            coxPassword: '',
            mojixEmail: 'YOUR_NAME@mojix.com',
            mojixPassword: ''
        };
        fs.writeFileSync( credentials_file, JSON.stringify(defaultCredentials, null, 2) );
        logger.log(`${credentials_file} created in the current directory. Please edit it and rerun the application`);
    }
    const conf_file ='./config.js';
    if( ! fs.existsSync(conf_file) ) {
        // fs.writeFileSync( conf_file, JSON.stringify(conf_defaults, null, 2) );
        const configBaseContents = fs.readFileSync(`${__dirname}/configBase.static.js`, 'utf8');
        fs.writeFileSync( conf_file, configBaseContents );
        logger.log(`${conf_file} created in the current directory. Please edit it and rerun the application`);
        process.exit(1);
    }
    // nconf.file({file: conf_file});
    const configJsObj = require(process.cwd() + '/config.js')

    nconf.argv()
        // .env()
        // .file({ file: conf_file })
        //.defaults(require('../config.js'));
        .defaults(configJsObj);

    return nconf.get(null);
}

function getExecTargetDate(rawWeek, baseDate = new Date()) {
    if(typeof(rawWeek) == 'number'){
        return dateFns.addWeeks(baseDate, rawWeek);
    }
    return baseDate;
}

function getExecConfig (rawCfg, targetDate) {
    const rawCfgClone = JSON.parse(JSON.stringify(rawCfg));
    const execConfig = rawCfgClone.defaults;
    // TODO: apply weekOverrides

    // execConfig.weekDelta = execConfig.weekDelta || 0;

    // Normalize projectHours
    const projectHours = execConfig.projectHours;
    for(const prj in projectHours) {
        if(projectHours[prj].length) {
            projectHours[prj] = {
                notes: '',      // TODO: Calculate notes
                hours: projectHours[prj]
            }
        } else {
            projectHours[prj].notes = projectHours[prj].notes || '';
        }
    }
    return execConfig;
}

module.exports = { readConfig, getExecConfig, getExecTargetDate };