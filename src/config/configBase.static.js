/*
 config.js Configuration file

 Please se README.md for more advanced configuration (notes, weekOverrides)
*/
const config = {
    credentials: require('./credentials.json'),
    mfaType: 'sms', // For now, only SMS is supported. It will only be used if Cox asks for MFA while logging in.
    week: 0,        // 0 will log current week. -1 for last week, -2 for 2 weeks ago, etc
    defaults: {
        emailSettings: {
            to: ['cox_report@mojix.com'],
            cc: ['LEAD_NAME@mojix.com'],
            bcc: [],
            subjectTemplate: '{weekendDate} 0000 YOUR_LAST_NAME'     // Here the convention is to put your employee ID and last name
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday' ],
        /*The project key is the project id (found in timesheet page) and the first letters of the category (case insensitive)
          DEV = Development
          SUP = Support and Maintenance
          BUG = Bug Fixes
          PLA = Planning
        */
        projectHours: {
            'PRJ0010000/DEV': [ 2, 2, 2, 2, 2 ],
            'PRJ0020000/SUP': [ 1, 1, 1, 1, 1 ],
            'PRJ0020000/BUG': [ 5, 5, 5, 5, 5 ]
        }
    },

    // This flag is to ask the user for confirmation before submission. Set to false if running with cronjob or if you want to run and forget
    promptForConfirmation: true,
    /*
    * These dates will be marked as 0 (overriding defaults) and will be
    * automatically added to Notes, like "Monday: Holiday | Thursday: PTO"
    */
    zeroDays: {
        "Holiday": ['2018-12-25', '2019-01-01', '2019-12-25', '2020-01-01'],
        "PTO": [],
        "Sick leave": [],
        "Put here your custom reason for zeroday": []
    }
}

module.exports = config;