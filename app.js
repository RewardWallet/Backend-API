
var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var childProcess = require('child_process');
require('dotenv').config();

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
var port = process.env.PORT || 1337;
var mountPath = process.env.PARSE_MOUNT || '/parse';
var serverURL = (process.env.SERVER_URL || 'http://localhost') + ':' + port + mountPath;

var api = new ParseServer({
  appName: process.env.APP_NAME,
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: __dirname + '/cloud/main.js',
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  readOnlyMasterKey: process.env.READ_ONLY_MASTER_KEY,
  serverURL: serverURL,
  publicServerURL: process.env.PUBLIC_SERVER_URL,
  verbose: false,
  verifyEmail: true,
  push: {
    // android: {
    //     senderId: process.env.ANDROID_SENDER_ID || ''
    //     apiKey: process.env.ANDROID_API_KEY || ''
    // },
    ios: [
      {
        pfx: 'io.rewardwallet.iosclient.dev.push.p12',
        bundleId: process.env.BUNDLE_ID,
        production: false
      },
      {
        pfx: 'io.rewardwallet.ios.prod.push.p12',
        bundleId: process.env.BUNDLE_ID,
        production: true
      }
    ]
  },
  facebookAppIds: process.env.FACEBOOK_APP_IDS,
  // passwordPolicy: {
  //   validatorPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/, // enforce password with at least 8 char with at least 1 lower case, 1 upper case and 1 digit
  //   doNotAllowUsername: true, // optional setting to disallow username in passwords
  //   resetTokenValidityDuration: 24*60*60, // expire after 24 hours
  // },
  emailAdapter: {
    module: '@parse/simple-mailgun-adapter',
    options: {
      // The address that your emails come from
      fromAddress: 'no-reply@' + process.env.EMAIL_DOMAIN || 'example.ca',
      // Your domain from mailgun.com
      domain: process.env.EMAIL_DOMAIN || 'example.ca',
      // Your API key from mailgun.com
      apiKey: process.env.EMAIL_API || 'key-12345',
      verificationSubject: 'Verify your e-mail for: %appname%',
      // Verification email body
      verificationBody: 'Hi,\n\nYou are being asked to confirm the e-mail address %email% with %appname%\n\nClick here to confirm it:\n%link%',
      // Password reset email subject
      passwordResetSubject: 'Password Reset Request for: %appname%',
      // Password reset email body
      passwordResetBody: 'Hi,\n\nYou requested a password reset for %appname%.\n\nClick here to reset it:\n%link%'
    }
  },
  maxUploadSize: '50mb'
});

var app = express();

app.use(mountPath, api);

app.post("/deploy", function(request, response) {
    console.log("> Deploying updates...");
    childProcess.exec('sh deploy.sh', function(error, stdout, stderr) {
        if (error) {
            console.log("> Deployment Failed");
            return response.json(error);
        }
        console.log("> Updates Deployed Successfully");
        response.json({"code": 200, "status": "Successfully Deployed"});
    });
})

// Parse Server plays nicely with the rest of your web routes
app.get('/status', function(req, res) {
  res.status(200).send('Online');
});

var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('> Listening at ' + serverURL);
    console.log('> Access at ' + process.env.PUBLIC_SERVER_URL);
});

// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);
