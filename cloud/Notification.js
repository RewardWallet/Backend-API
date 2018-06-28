'use strict';

class Notification extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Notification');
        // All other initialization

        // Only read access to the transaction
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        this.setACL(acl);
    }

    setDescription(value) {
        this.set("text", value);
    }

    getDescription() {
        return !(typeof this.get("text") === 'undefined') ? this.get("text") : "";
    }

    setUser(value) {
        this.set("user", value);
    }

    getUser() {
        return !(typeof this.get("user") === 'undefined') ? this.get("user") : null;
    }

}

Parse.Object.registerSubclass('Notification', Notification);
module.exports = {Notification};