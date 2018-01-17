
var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
var port = process.env.PORT || 1337;
var mountPath = process.env.PARSE_MOUNT || '/parse';
var serverURL = process.env.SERVER_URL || 'https://localhost:' + port + mountPath;

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: serverURL
});

var app = express();

app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/status', function(req, res) {
  res.status(200).send('Online');
});

var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('Now running at ' + serverURL);
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
