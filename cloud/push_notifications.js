'use strict';

const Notification = require('./Notification').Notification;

const PUSH_SUCCESS = {"message":"Notification Delivered"};
const PUSH_ERROR = function(error) { return {"message": "Delivery Error" + error.message} };

Parse.Cloud.define("pushToUser", function (request, response) {

    const user = request.params.user;
    const message = request.params.message;

    const userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo('objectId', user);
    const query = new Parse.Query(Parse.Installation);
    query.matchesQuery('user', userQuery);

    const payload = {
        alert: message,
        sound: "default"
    };

    Parse.Push.send({ data: payload, where: query }, { useMasterKey: true })
        .then(function (result) {
            response.success(PUSH_SUCCESS);
            
            userQuery.find().then(function (users) {
                for (var i = 0; i < users.length; i++) {
                    var notification = new Notification();
                    notification.setUser(users[i]);
                    notification.setDescription(message);
                    notification.save();
                }
            })
            
        }).catch(function (error) {
        response.error(PUSH_ERROR(error));
    });
});

Parse.Cloud.define("pushToUsers", function (request, response) {

    const users = request.params.users;
    const message = request.params.message;

    const userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn('objectId', users);
    const query = new Parse.Query(Parse.Installation);
    query.matchesQuery('user', userQuery);

    const payload = {
        alert: message,
        sound: "default"
    };

    Parse.Push.send({ data: payload, where: query }, { useMasterKey: true })
        .then(function (result) {
            response.success(PUSH_SUCCESS);
        }).catch(function (error) {
        response.error(PUSH_ERROR(error));
    });
});

Parse.Cloud.define("pushToChannel", function (request, response) {

    const channel = request.params.channel;
    const message = request.params.message;

    const payload = {
        alert: message,
        sound: "default"
    };

    Parse.Push.send({ channels: [channel],  data: payload }, { useMasterKey: true })
        .then(function (result) {
            response.success(PUSH_SUCCESS);
        }).catch(function (error) {
        response.error(PUSH_ERROR(error));
    });
});

Parse.Cloud.define("pushToChannels", function (request, response) {

    const channels = request.params.channels;
    const message = request.params.message;

    const payload = {
        alert: message,
        sound: "default"
    };

    Parse.Push.send({ channels: channels, data: payload }, { useMasterKey: true })
        .then(function (result) {
            response.success(PUSH_SUCCESS);
        }).catch(function (error) {
        response.error(PUSH_ERROR(error));
    });
});
