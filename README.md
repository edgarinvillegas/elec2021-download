# cox-timesheet
##Automatic cox timesheet filler.
It can be executed on demmand, but better to have it scheduled to run automatically every week.

*Documentation still in progress.*

### Installing
```sh
$ npm install -g cox-timesheet
```
(You can also use yarn)

### Executing
```sh
$ mkdir my-timesheets
$ cd my-timesheets
$ cox-timesheet
```
(Creating a folder is optional, but it's handy so you'll have the config files there).

That's it!, then follow the instructions that appear on screen.

This will create a `credentials.json` and `config.js` file. Edit them and rerun `cox-timesheet`.  
To edit `config.js`, check the following examples:

### About config.js:
- Typical example: (See comments inline)

```javascript
const config = {
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
    // This flag is to ask the user for confirmation before submission. Set to false if running with cronjob or if you want to run and forget
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
```

### Advanced example with weekOverrides.

`weekOverrides` overrides the default configuration for a specific week.  
More detailed description coming soon.

```javascript
const config = {
    credentials: require('./credentials.json'),
    week: 0,        // 0 will log current week. -1 for last week, -2 for 2 weeks ago, etc. It must be <= 0
    mfaType: 'sms', // For now, only SMS and okta-verify are supported. It will only be used if Cox asks for MFA while logging in.
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
    },

    /* weekOverrides is used for weeks different than the default. Mainly used for holidays, vacations, etc
     * (Dates outside config.week won't be processed, so you can fill in advance without problems.)
     * This has more precedence than zeroDays.
     */
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
```

### FAQ Frequently asked questions

1. *Why does it send the email report in png instead of pdf?*  

   Sending PDF was in the roadmap. However, for Mojix it's the same to receive a pdf or png, both demonstrate a logged timesheet.
   So, it's unlikely  cox-timesheet will support pdf attachment.

2. *Is it secure? Does it send my passwords anywhere?*

   `cox-timesheet` doesn't store or send any password. You can check the code, that's the warranty.

   If you don't feel comfortable leaving your passwords in the config file, you can also provide them as command line arguments or environment variables.
   This project uses nconf, which allows you to send command line parameters to override configuration, for example:
   ```
   node index.js --credentials:coxPassword=myCoxPassword123 --credentials:mojixPassword=myMojixPassword456
   ```

   You can also set them as environment variables. (nconf format).

3. *How can I program it to run automatically every friday?*

   You can use cronjobs in *nix and 'at' command on Windows (Need docs? open an issue please). It's recommended for it to run on a 24/7 workstation/server.
   You'll just need to update the `zeroDays` (or weekOverrides for something very custom) from time to time when you know you'll be off.

4. *If there's an error and timesheet cannot be filled, what happens?*

   If there's an error in the process, it will send you an email (to your mojix/cox email) with the error log and a screenshot of the last step achieved.
   It won't send an email to cox_report@mojix.com, (or to the "to" field).
   If there's an error with the basic configuration, like wrong credentials, it will just log to the console and will exit with code 1.

5. *What happens if I already submitted the timesheet and run the program?.*

   Nothing! :) so you can safely rerun the program n times. It's idemnpotent by default.
   It will tell you it was already logged and won't send the email to cox_report, but it will send an email to yourself, indicating that.

6. *Can I fill future timesheets?*

   Not yet, that might come if requested. 

### Appendix: Running from source
```
git clone https://github.com/edgarinvillegas/cox-timesheet.git
cd cox-timesheet
npm install
node index.js
```
## Changelog
0.5.0 Added support for okta-verify (push notification) multifactor authentication type