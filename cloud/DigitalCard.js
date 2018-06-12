'use strict';

const Coin = require('./Coin').Coin;

class DigitalCard extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('DigitalCard');
        // All other initialization

        // Only read access to the transaction
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        this.setACL(acl);
    }

    setUser(value) {
        this.set("user", value);
    }

    getUser() {
        return !(typeof this.get("user") === 'undefined') ? this.get("user") : null;
    }

    setBusiness(value) {
        this.set("business", value);
    }

    getBusiness() {
        return !(typeof this.get("business") === 'undefined') ? this.get("business") : null;
    }

    addPoints(value) {
        this.set("points", this.getPoints() + value);
    }

    subtractPoints(value) {
        this.set("points", this.getPoints() - value);
    }

    getPoints() {
        return !(typeof this.get("points") === 'undefined') ? this.get("points") : 0;
    }

}

// Parse.Cloud.beforeFind('DigitalCard', function(req) {
//
//     // const query = req.query; // the Parse.Query
//     const query = new Parse.Query(Coin)
// });

Parse.Object.registerSubclass('DigitalCard', DigitalCard);
module.exports = {DigitalCard};