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
        .defaults(conf_defaults);

    return nconf.get(null);
}

module.exports = readConfig;