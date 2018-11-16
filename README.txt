cox-timesheet (alpha)
Author: edgarinvillegas@hotmail.com

Automatic cox timesheet filler.
Can be executed on demmand, but better to have it scheduled to run automatically every week.

*** Installing: ***
git clone https://github.com/edgarinvillegas/cox-timesheet.git
cd cox-timesheet
npm install

*** Executing ***
node index.js

This will create a credentials.json and config.js file. Edit them and rerun node index.js
To edit config.js, check the following example:

*** About config.js: ****
- EXAMPLE: (See comments inline)

{
    credentials: require('./credentials.json'),
    week: 0,        // 0 will log current week. -1 for last week, -2 for 2 weeks ago, etc. It must be <= 0
    defaults: {
        emailSettings: {
            to: ['cox_report@mojix.com'],
            cc: ['LEAD_NAME@mojix.com'],
            bcc: [],
            subjectTemplate: '{weekendDate} 1234 PEREZ'
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

- ADVANCED EXAMPLE with weekOverrides.
weekOverrides overrides the default configuration for a specific week.
TODO: Add more detailed description.

{
    credentials: require('./credentials.json'),
    week: 0,        // 0 will log current week. -1 for last week, -2 for 2 weeks ago, etc. It must be <= 0
    defaults: {
        emailSettings: {
            to: ['cox_report@mojix.com'],
            cc: ['LEAD_NAME@mojix.com'],
            bcc: [],
            subjectTemplate: '{weekendDate} 1234 PEREZ'
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
            'PRJ0020000/BUG': {         //Alternative syntax to have notes.
                hours: [ 5, 5, 5, 5, 5 ],
                notes: 'Prod bug fixing as usual'
            },
        }
    },
    /*
    * These dates will be marked as 0 (overriding defaults) and will be
    * automatically added to Notes, like "Monday: Holiday | Thursday: PTO"
    */
    zeroDays: {
        "Holiday": ['2018-06-06', '2018-11-02', '2018-12-25', '2019-01-01'],
    }

    //weekOverrides is used for weeks different than the default. Mainly used for holidays, vacations, etc
    //(Dates outside config.week won't be processed, so you can fill in advance without problems.)
    // This has more precedence than zeroDays.
    weekOverrides: {
            '2018-11-13': {     // This string can be any date in the desired week.
                emailSettings: {    // Specifying this will override only internal fields
                    cc: ['LEAD_NAME@mojix.com', 'pepito@mojix.com']     // This week I want to send to pepito as well
                },
                projectHours: {     // Specifying projectHours will overwrite the whole projectHours node
                    'PRJ0020909/DEV': {
                        hours: [ 8, 8, 8, 0, 8 ],
                        notes: 'Exceptional week. Thursday was All Saints holiday'
                    },
                }
            }
        }
}

FAQ Frequently asked questions

1) Is it secure? Does it send my passwords anywhere?
cox-timesheet doesn't store or send any password. You can check the code, that's the warranty.

If you don't feel comfortable leaving your passwords in the config file, you can also provide them as command line arguments.
Documentation coming soon.

2) Why isn't it a downloadable npm module?
That's coming soon.

3) How can program it to run automatically every friday?
You can use cronjobs in *nix and 'at' command on Windows (Documentation coming soon). It's recommended for it to run on a 24/7 workstation/server.
You'll just need to update the `exceptionalHours` from time to time when you know you'll be off.





