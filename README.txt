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

*** About config.json: ****
EXAMPLE: (See comments inline)

{
  "credentials": {
    "coxEmail": "edgar.villegas@coxautoinc.com", // Mandatory.  Needed to fill the timesheet
    "coxPassword": "****",  // Mandatory
    "mojixEmail": "edgar.villegas@mojix.com",   // Mandatory. This is needed to send the email. Can be any gmail account.
    "mojixPassword": "****"  // Mandatory
  },
  "project": "PRJ0012345",      // Mandatory. This is found in the timesheet page, in the left sidebar. Always starts with PRJ
  "category": "Development",    // Mandatory. Can also be "Planning", "Bug Fixes" or "Maintenance and Support". Case sensitive for now
  "defaultHours": {     // Optional. Will assume 8 hours monday-friday if omitted.
    "monday": 8,
    "tuesday": 8,
    "wednesday": 8,
    "thursday": 8,
    "friday": 8
  },
  // Optional. This is where you put holidays, vacations, time offs, etc. No problem if past dates appear here.
  "exceptionalHours": {
      "2018-11-01": 0,      // A single time off day
      "2017-12-31:2018-01-05": 0,  // This is a sample range of new year's vacations
  },
  "emailSettings": {
    "to": [         // Mandatory
      "cox_report@mojix.com"
    ],
    "cc": [],       // Optional. Usually the lead's email will come here
    "bcc": [],      // Optional.
    "subjectTemplate": "{weekendDate} 1234 Villegas"   // Mandatory. {weekendDate} will be replaced by saturday's date.
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





