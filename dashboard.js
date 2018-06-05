
var express = require('express');
var ParseDashboard = require('parse-dashboard');
require('dotenv').config();

var port = process.env.PORT || 1337;
var mountPath = process.env.PARSE_MOUNT || '/parse';
var serverURL = (process.env.SERVER_URL || 'http://localhost') + ':' + port + mountPath;

var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": serverURL,
      "appId": process.env.APP_ID,
      "masterKey": process.env.MASTER_KEY,
      "appName": process.env.APP_NAME
    }
  ]
});

var app = express();
app.use('/api/dashboard', dashboard);

var httpServer = require('http').createServer(app);
httpServer.listen(1336, function() {
    console.log('Now running at http://localhost:1336/api/dashboard');
});
