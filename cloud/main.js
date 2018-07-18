'use strict';

// Push Notifications
require('./push_notifications');

// Transactions
require('./transactions');

// Testing
require('./testing');

Parse.Cloud.define("hello", function (request, response) {
    response.success("Hello world!");
});

Parse.Cloud.define("deploy", function (request, response) {
    console.log("> Deploying updates...");
    require('child_process').exec('sh deploy.sh', function(error, stdout, stderr) {
        if (error) {
            console.log("> Deployment Failed");
            return response.json(error);
        }
        console.log("> Updates Deployed Successfully");
        response.json({"code": 200, "status": "Deployment Successful"});
    });
});
