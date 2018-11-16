/*
 config.js Configuration file

 To print this config, run
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
        sendEmailIfAlreadySubmitted: false,
        projectHours: {
            'PRJ0010000/DEV': [ 2, 2, 2, 2, 2 ],
            'PRJ0020000/SUP': [ 1, 1, 1, 1, 1 ],
            'PRJ0020000/BUG': {      // This is an Alternative syntax if you want to provide notes.
                hours: [ 5, 5, 5, 5, 5 ],
                notes: 'Resolved prod bugs'
            },

        }
    },
    weekOverrides: {
        '2018-11-03': {
            emailSettings: {    // Specifying this will override only internal fields
                cc: ['LEAD_NAME@mojix.com', 'pepito@mojix.com']     // This week I want to send to pepito as well
            },
            projectHours: {     // Specifying projectHours will override the whole projectHours node
                'PRJ0010000/DEV': {
                    hours: [ 8, 8, 0, 8, 8 ],
                    notes: 'Wednesday was a holiday'
                },
            }
        }
    }
}

module.exports = config;