const yup = require('yup');
const objectMap = require('object.map');

const { weekdayNames } = require('../constants');

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

    // Object with dynamic keys sample: https://runkit.com/bogdansoare/59cfd9ac1de3eb0012c4a436
    const projectHoursSchema = yup.lazy(projectHours => yup.object().shape(
        objectMap(projectHours, (prjData, prjId) => {
            return yup.object().shape({
                notes: yup.string(),
                hours: yup.array().of(yup.number().min(0))
            })
            .test('valid-project-id', '${path} key is not valid. Format must be in format PROJECT_ID/CATEGORY', prjData => {
                return /.+\/.+/.test(prjId);
            })
            .transform((currValue, originalValue) => ({
                notes: originalValue.notes,
                hours: Array.isArray(originalValue) ? originalValue : originalValue.hours
            }));
        })
    ))

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
            projectHours: projectHoursSchema
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
        console.log('Configuration errors:\n', validationExc.errors.map(m => ` - ${m}`).join('\n'));
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

module.exports = transformAndValidate;
