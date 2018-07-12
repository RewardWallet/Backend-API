'use strict';

const DigitalCard = require('./DigitalCard').DigitalCard;
const Notification = require('./Notification').Notification;

const PUSH_SUCCESS = {"message":"Notification Delivered"};
const PUSH_ERROR = function(error) { return {"message": "Delivery Error" + error.message} };

Parse.Cloud.define("sendNotificationToCustomers", function (request, response) {

    const businessId = request.params.businessId;
    const message = request.params.message;
    
    const cardQuery = new Parse.Query(DigitalCard);
    cardQuery.equals('business', businessId);
    cardQuery.find().then(function (cards) {

        const userIds = cards.map( card => card.get('user').id);
        Parse.Cloud.run("pushToUsers", { users: userIds, message: message });

        const userQuery = new Parse.Query(Parse.User);
        userQuery.contains('objectId', userIds);
        userQuery.find().then(function (users) {

            for (var i = 0; i < users.length; i++) {
                const notification = new Notification();
                notification.setUser(users[i])
                notification.setDescription(message);
                notification.save().then(function (result) {
                    console.log("> Notification Sent")
                });
            }
            response.success(PUSH_SUCCESS);

        }).catch(function (error) {
            response.error(PUSH_ERROR(error))
        });
        
    }).catch(function (error) {
        response.error(PUSH_ERROR(error))
    });
});

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
