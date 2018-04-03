
var express = require('express');
var ParseDashboard = require('parse-dashboard');
require('dotenv').config();

var port = 1336;
var serverURL = 'http://localhost' + ':' + port;

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
httpServer.listen(port, function() {
    console.log('Now running at ' + serverURL);
});
