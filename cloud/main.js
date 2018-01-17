
//***********************************
// PUSH NOTIFICATIONS
//***********************************

Parse.Cloud.define("pushToUser", function(request, response) {

  var user = request.params.user;
  var message = request.params.message;

  var userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo('objectId', user);
  var query = new Parse.Query(Parse.Installation);
  query.matchesQuery('user', userQuery);

  var payload = {
    alert: message,
    sound: "default"
  };

  Parse.Push.send({
      data: payload,
      where: query
    }, {
      useMasterKey: true
    })
    .then(function() {
      response.success("PUSH OK");
    }, function(error) {
      response.error("PUSH ERROR:" + error.message);
    });
});

Parse.Cloud.define("pushToUsers", function(request, response) {

  var users = request.params.users;
  var message = request.params.message;

  var userQuery = new Parse.Query(Parse.User);
  userQuery.containedIn('objectId', users);
  var query = new Parse.Query(Parse.Installation);
  query.matchesQuery('user', userQuery);

  var payload = {
    alert: message,
    sound: "default"
  };

  Parse.Push.send({
      data: payload,
      where: query
    }, {
      useMasterKey: true
    })
    .then(function() {
      response.success("PUSH OK");
    }, function(error) {
      response.error("PUSH ERROR:" + error.message);
    });
});

Parse.Cloud.define("pushToChannel", function (request, response) {

  var channel = request.params.channel;
  var message = request.params.message;

  var payload = {
    alert: message,
    sound: "default"
  };

  Parse.Push.send({
      channels: [channel].
      data: payload
    }, {
      useMasterKey: true
    })
    .then(function() {
      response.success("PUSH OK");
    }, function(error) {
      response.error("PUSH ERROR:" + error.message);
    });
});

Parse.Cloud.define("pushToChannels", function (request, response) {

  var channels = request.params.channels;
  var message = request.params.message;

  var payload = {
    alert: message,
    sound: "default"
  };

  Parse.Push.send({
      channels: channels.
      data: payload
    }, {
      useMasterKey: true
    })
    .then(function() {
      response.success("PUSH OK");
    }, function(error) {
      response.error("PUSH ERROR:" + error.message);
    });
});
