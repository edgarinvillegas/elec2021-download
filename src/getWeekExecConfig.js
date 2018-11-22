const dateFns = require('date-fns');

function normalizeWeekConfig(baseWeekConfig){
    const weekExecConfig =  JSON.parse(JSON.stringify(baseWeekConfig));

    // Normalize projectHours
    const projectHours = weekExecConfig.projectHours;
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
    // Normalize workingDays
    if(!weekExecConfig.workingDays) {
        weekExecConfig.workingDays = weekdayNames.slice(1, 6); //Monday to friday
    }
    weekExecConfig.workingDays = weekExecConfig.workingDays.map(d => d.toLowerCase());
    weekExecConfig.sendEmailIfAlreadySubmitted = !!weekExecConfig.sendEmailIfAlreadySubmitted;
    return weekExecConfig;
}

/**
 * Gets the calculated configuration for targetDate week.
 * @param rawCfg
 * @param targetDate
 * @returns {Object}
 */
function getWeekExecConfig (rawCfg, targetDate) {
    const defaultNormalizedWeekConfig = normalizeWeekConfig(rawCfg.defaults)
    let weekExecConfig = JSON.parse(JSON.stringify(defaultNormalizedWeekConfig));
    //let weekExecConfig = normalizeWeekConfig(rawCfg.defaults);  //Start with defaults

    (function processZeroDays(){
        const projectHours = weekExecConfig.projectHours;
        if(rawCfg.zeroDays) {
            const dayReasons = weekExecConfig.workingDays.map( (day, i) =>  {
                return getZeroDayReason(targetDate, i, rawCfg.zeroDays);
            });

            Object.entries(projectHours).forEach( ([prj, { hours, notes }]) => {
                // console.log(prj, hours, notes);
                const zeroDayNotes = [];
                weekExecConfig.workingDays.forEach( (day, i) =>  {
                    const reason = dayReasons[i];
                    // If there's a zeroDayReason for the day, make it 0, otherwise keep value.
                    hours[i] = reason === null ? hours[i] : 0;
                    if(reason !== null && reason !== '') {
                        zeroDayNotes.push(`${day.toUpperCase()}: ${reason}`);
                    }
                });
                if(zeroDayNotes.length) {
                    projectHours[prj].notes += '\n' + zeroDayNotes.join(' | ');
                }
            });
        }
    })();



    // Week overrides
    const targetSaturday = getFormattedDateByWeekday(targetDate, 6);
    if(rawCfg.weekOverrides) {
        let mergedWeekConfig = null;
        Object.entries(rawCfg.weekOverrides).forEach( ([oDateRange, oWeekCfg]) => {
            // console.log('must override: ', mustOverride(targetDate, oDateRange));
            if(!mustOverride(targetDate, oDateRange)) return;
            mergedWeekConfig = JSON.parse(JSON.stringify(defaultNormalizedWeekConfig));   // Starts with default values
            const mergedEmailSettings = Object.assign({}, mergedWeekConfig.emailSettings, oWeekCfg.emailSettings);
            Object.assign(mergedWeekConfig, oWeekCfg);
            mergedWeekConfig.emailSettings = mergedEmailSettings;
        });
        if(mergedWeekConfig){
            weekExecConfig = mergedWeekConfig;
        }
    }

    return weekExecConfig;
}

function mustOverride(targetDate, oDateRangeStr) {
    const date1 = oDateRangeStr.split(':')[0];
    const date2 = oDateRangeStr.split(':')[1] || date1;
    const startDate = getFormattedDateByWeekday(date1, 0);  // Sunday
    const endDate = getFormattedDateByWeekday(date2, 6);    // Saturday
    const formattedTargetDate = dateFns.format(targetDate, 'YYYY-MM-DD');
    // console.log(`${startDate} <= ${formattedTargetDate} <= ${endDate} `);
    return startDate <= formattedTargetDate && formattedTargetDate <= endDate;
}

/**
 * Returns the weekday of the targetDate's week, formatted
 * For example, if tomorrow is Thursday, Nov 9, 2018
 * then getFormattedDateByWeekday(new Date(), 3) will return '2018-11-09' (3 = thursday)
 * @param targetDate A date of the week
 * @param weekday 0 for sunday, 1 for monday, etc
 * @returns {string}
 */
function getFormattedDateByWeekday(targetDate, weekday) {   //@uses()
                                                            //return dateFns.format(dateFns.startOfWeek(targetDate, {weekStartsOn: weekday}), 'YYYY-MM-DD');
    const weekStartDate = dateFns.startOfWeek(targetDate, {weekStartsOn: 0});
    return dateFns.format(dateFns.addDays(weekStartDate, weekday) , 'YYYY-MM-DD');
}

function getZeroDayReason(targetDate, weekday, zeroDays) {  //@uses()
    const formattedDate = getFormattedDateByWeekday(targetDate, weekday);
    let ret = null;
    Object.entries(zeroDays).forEach( ([ reason, dates ]) => {
        // console.log('---- ', reason);
        dates.forEach( dateRange => {
            // console.log('-- dateRange: ', dateRange)
            const startDate = dateRange.split(':')[0].trim();
            const endDate = (dateRange.split(':')[1] || startDate).trim();
            if(startDate <= formattedDate && formattedDate <= endDate) {
                ret = reason;
                // console.log(formattedDate, ' is ', reason);
            }
        });
    });
    // console.log('Reason for ', formattedDate, ': ', ret);
    return ret;
}

module.exports = getWeekExecConfig;