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
    const conf_file ='./config.json';
    if( ! fs.existsSync(conf_file) ) {
        // fs.writeFileSync( conf_file, JSON.stringify(conf_defaults, null, 2) );
        const configBaseContents = fs.readFileSync(`${__dirname}/configBase.json`, 'utf8');
        fs.writeFileSync( conf_file, configBaseContents );
        logger.log(`Please edit ${conf_file} and rerun the application`);
        process.exit(1);
    }
    // nconf.file({file: conf_file});
    nconf.argv()
        // .env()
        .file({ file: conf_file })
        // .defaults(conf_defaults);

    return  nconf.get(null);
}

function getExecConfig (rawCfg, targetDate) {
    const rawCfgClone = JSON.parse(JSON.stringify(rawCfg));
    const execConfig = rawCfgClone.defaults;
    // TODO: apply weekOverrides

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

module.exports = { readConfig, getExecConfig };