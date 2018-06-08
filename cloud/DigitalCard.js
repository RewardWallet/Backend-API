'use strict';

class DigitalCard extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('DigitalCard');
        // All other initialization
        this.set('points', 0);

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

Parse.Object.registerSubclass('DigitalCard', DigitalCard);
module.exports = {DigitalCard};