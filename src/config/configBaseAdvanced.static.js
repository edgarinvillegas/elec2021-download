/*
 config.js Configuration file

 To print this config in command line, run
 node -e "console.log(JSON.stringify(require('./config.js'), null, 2))"
*/
const config = {
    credentials: require('./credentials.json'),
    week: 0,        // 0 will log current week. -1 for last week, -2 for 2 weeks ago, etc
    defaults: {
        emailSettings: {
            to: ['cox_report@mojix.com'],
            cc: ['LEAD_NAME@mojix.com'],
            bcc: [],
            subjectTemplate: '{weekendDate} 1234 PEREZ'
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday' ],
        // Set as true if the timesheet is already submitted but you want to send the email to cox
        sendEmailIfAlreadySubmitted: false,
        /*The project key is the project id (found in timesheet page) and the first letters of the category (case insensitive)
          DEV = Development
          SUP = Support and Maintenance
          BUG = Bug Fixes
          PLA = Planning
        */
        projectHours: {
            'PRJ0010000/DEV': [ 2, 2, 2, 2, 2 ],
            'PRJ0020000/SUP': [ 1, 1, 1, 1, 1 ],
            'PRJ0020000/BUG': {      // This is an Alternative syntax if you want to provide notes.
                hours: [ 5, 5, 5, 5, 5 ],
                notes: 'Resolved prod bugs'
            },

        }
    },
    // This flag is to ask the user for confirmation before submission. Set to false if running with cronjob or if you want to run and forget
    promptForConfirmation: false,

    /*
    * These dates will be marked as 0 (overriding defaults) and will be
    * automatically added to Notes, like "Monday: Holiday | Thursday: PTO"
    */
    zeroDays: {
        "Holiday": ['2018-06-06', '2018-11-02', '2018-12-25', '2019-01-01'],
        "PTO": [],
        "Sick leave": [],
        "Put here your custom reason for zeroday": []
    },

    //weekOverrides is used for weeks different than the default. Mainly used for holidays, vacations, etc
    //(Dates outside config.week won't be processed, so you can fill in advance without problems.)
    weekOverrides: {
        '2018-11-03': {     // This string can be any date in the desired week.
            emailSettings: {    // Specifying this will override only internal fields
                cc: ['LEAD_NAME@mojix.com', 'pepito@mojix.com']     // This week I want to send to pepito as well
            },
            projectHours: {     // Specifying projectHours will override the whole projectHours node
                'PRJ0010000/DEV': {
                    hours: [ 8, 8, 8, 0, 8 ],
                    notes: 'Thursday was All Saints holiday'
                },
            }
        }
    }
}

module.exports = config;