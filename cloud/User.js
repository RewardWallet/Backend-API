'use strict';

class User extends Parse.User {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('_User');
        // All other initialization
    }

    availableCoupons() {
        return !(typeof this.relation("availableCoupons") === 'undefined') ? this.relation("availableCoupons") : null;
    }

}

Parse.Cloud.afterDelete("_User", function(request) {
    const query = new Parse.Query("DigitalCard");
    query.equalTo("user", request.object);
    query.find({ useMasterKey: true })
        .then(function (results) {
            var promises = [];
            for (var i = 0; i < results.length; i++) {
                promises.push(results[i].destroy({ useMasterKey: true }));
            }
            Promise.all(promises).then(function (result) {
                console.log('\x1b[33m%s\x1b[0m', "> DigitalCard's deleted");
            });
        }).catch(function (error) {
            console.error("Error deleting users DigitalCard's, " + error.code + ": " + error.message);
        });
});

Parse.Object.registerSubclass('_User', User);
module.exports = {User};