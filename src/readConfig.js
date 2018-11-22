const fs    = require('fs');
const nconf = require('nconf');
const dateFns = require('date-fns');
const objectMap = require('object.map');
const yup = require('yup');

const logger = require('./lib/logger');
const { weekdayNames } = require('./constants');

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
    return transformAndValidate(rawCfg);
}

function getConfigValidationSchema() {
    // Useful when a string is supplied as recipient (instead of array)
    function normalizeToArray(maybeArray){
        if(Array.isArray(maybeArray)) return maybeArray;
        if(maybeArray === undefined) return [];
        return [maybeArray];
    }
    const normalizeProjectHours = (projectHours = {}) => objectMap(projectHours, prjData => {
        return {
            notes: prjData.notes,
            hours: prjData.length ? prjData : prjData.hours
        };
    });

    const emailRecipentSchema = yup.array().of(yup.string().email().required())
        .transform( (currValue, origValue) => normalizeToArray(origValue) );

    const schema = yup.object().required().shape({
        credentials: yup.object().shape({
            coxEmail: yup.string().email().required(),
            coxPassword: yup.string().min(6).required(),
            mojixEmail: yup.string().email().required(),
            mojixPassword: yup.string().required()
        }),
        week: yup.number().max(0).default(0),
        defaults: yup.object().required().shape({
            emailSettings: yup.object().required().shape({
                to: emailRecipentSchema.required(), //To disallow []
                cc: emailRecipentSchema,
                bcc: emailRecipentSchema,
                subjectTemplate: yup.string().default('{weekendDate} Timesheet').required()
            }),
            workingDays: yup.array().of(yup.string().oneOf(weekdayNames)).default(weekdayNames.slice(1,6)).required(),
            sendEmailIfAlreadySubmitted: yup.boolean().default(false),
            /*projectHours: yup.object().required().transform((currValue, origValue) => {
                return normalizeProjectHours(origValue)
            }).shape()*/
        }),
    });
    return schema;
}

function transformAndValidate(rawCfg) {
    const schema = getConfigValidationSchema();
    // const isValid = await schema.isValid();
    // console.log('isValid: ', isValid);
    const castCfg = schema.cast(rawCfg);
    try {
        schema.validateSync(rawCfg, { abortEarly: false });
    } catch (validationExc) {
        console.log('Configuration errors: \n', validationExc.errors.map(m => ` - ${m}`).join('\n'));
        process.exit(1);
    }
    // console.log(JSON.stringify(castCfg, null, 2));
    return castCfg;
}


// function vanillaTransformAndValidate(rawCfg) {
//     function normalizeToArray(maybeArray){
//         if(!maybeArray) return [];
//         if(maybeArray.length) return maybeArray;
//         return [maybeArray];
//     }
//
//     return {
//         credentials: (credentials => ({
//             coxEmail: credentials.coxEmail || '',
//             coxPassword: credentials.coxPassword || '',
//             mojixEmail: credentials.mojixEmail || '',
//             mojixPassword: credentials.mojixPassword || ''
//         }))(rawCfg.credentials || {}),
//         week: rawCfg.week || 0,
//         defaults: (weekCfg => ({
//             emailSettings: (es => ({
//                 to: normalizeToArray(es.to),
//                 cc: normalizeToArray(es.cc),
//                 bcc: normalizeToArray(es.bcc),
//                 subjectTemplate: es.subjectTemplate || '{weekendDate} Timesheet'
//             }))(weekCfg.emailSettings || {}),
//             workingDays: (workingDays =>
//                workingDays ? workingDays.map(d => d.toLowerCase()) : weekdayNames.slice(1,6)
//             )(weekCfg.workingDays),
//             // Set as true if the timesheet is already submitted but you want to send the email to cox
//             sendEmailIfAlreadySubmitted: !!weekCfg.sendEmailIfAlreadySubmitted,
//             /*The project key is the project id (found in timesheet page) and the first letters of the category (case insensitive)
//               DEV = Development
//               SUP = Support and Maintenance
//               BUG = Bug Fixes
//               PLA = Planning
//             */
//             projectHours: (projectHours => objectMap(projectHours, prjData => {
//                 return {
//                     notes: prjData.notes || '',
//                     hours: prjData.length ? prjData : prjData.hours
//                 }
//             }))(weekCfg.projectHours || {})
//         }))(rawCfg.defaults || {}),
//         weekOverrides: (weekOverrides => objectMap(weekOverrides, weekOverride => {
//             // return objectMap(weekOverride.emailSettings || {}, normalizeToArray)
//             return {
//                 emailSettings: objectMap(weekOverride.emailSettings || {}, normalizeToArray),
//                 projectHours: (projectHours => objectMap(projectHours, prjData => {
//                     return {
//                         notes: prjData.notes,
//                         hours: prjData.length ? prjData : prjData.hours
//                     }
//                 }))(weekOverride.projectHours || {})
//             };
//         }))(rawCfg.weekOverrides || {}),
//     };
// }

function getExecTargetDate(rawWeek, baseDate = new Date()) {
    if(typeof(rawWeek) == 'number' || rawWeek == Number(rawWeek)){
        if(rawWeek > 0) throw new Error('config.week cannot be positive yet. Enter a number equal or lower to 0')
        return dateFns.addWeeks(baseDate, Number(rawWeek));
    }
    if(typeof(rawWeek) == 'string') {
        return dateFns.parse(rawWeek);
    }
    return baseDate;
}


module.exports = { readConfig, getExecTargetDate };