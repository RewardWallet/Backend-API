'use strict';

class Coin extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Coin');
        // All other initialization
        this.set('points', 0);

        // Only read access to the transaction
        var acl = new Parse.ACL();
        this.setACL(acl);
    }

    setDigitalCard(value) {
        this.set("digitalCard", value);
    }

    getDigitalCard() {
        return !(typeof this.get("digitalCard") === 'undefined') ? this.get("digitalCard") : null;
    }

    setPoints(value) {
        this.set("points", value);
    }

    getPoints() {
        return !(typeof this.get("points") === 'undefined') ? this.get("points") : 0;
    }

}

Parse.Object.registerSubclass('Coin', Coin);
module.exports = {Coin};