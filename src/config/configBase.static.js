/*
 config.js Configuration file

 Please se README.md for more advanced configuration (notes, weekOverrides)
*/
const config = {
    credentials: require('./credentials.json'),
    week: 0,        // 0 will log current week. -1 for last week, -2 for 2 weeks ago, etc
    defaults: {
        emailSettings: {
            to: ['cox_report@mojix.com'],
            cc: ['LEAD_NAME@mojix.com'],
            bcc: [],
            subjectTemplate: '{weekendDate} 1234 PEREZ'     // Here the convention is to put your employee ID and last name
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
    promptForConfirmation: true,
    /*
    * These dates will be marked as 0 (overriding defaults) and will be
    * automatically added to Notes, like "Monday: Holiday | Thursday: PTO"
    */
    zeroDays: {
        "Holiday": ['2018-06-06', '2018-11-02', '2018-12-25', '2019-01-01'],
        "PTO": [],
        "Sick leave": [],
        "Put here your custom reason for zeroday": []
    }
}

module.exports = config;