'use strict';

class Business extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Business');
        // All other initialization
    }

    setName(value) {
        this.set("name", value);
    }

    getName() {
        return !(typeof this.get("name") === 'undefined') ? this.get("name") : "<UNKNOWN NAME>";
    }

    setRewardModel(value) {
        this.set("rewardModel", value);
    }

    getRewardModel() {
        return !(typeof this.get("rewardModel") === 'undefined') ? this.get("rewardModel") : null;
    }

}

Parse.Cloud.afterDelete("Business", function(request) {
    const query = new Parse.Query("Inventory");
    query.equalTo("business", request.object);
    query.find({ useMasterKey: true })
        .then(function (results) {
            var promises = [];
            for (var i = 0; i < results.length; i++) {
                promises.push(results[i].destroy({ useMasterKey: true }));
            }
            Promise.all(promises).then(function (result) {
                console.log('\x1b[33m%s\x1b[0m', "> Inventory items deleted");
            });
        }).catch(function (error) {
        console.error("Error deleting businesses Inventory items, " + error.code + ": " + error.message);
    });
});

Parse.Object.registerSubclass('Business', Business);
module.exports = {Business};