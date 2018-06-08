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

Parse.Object.registerSubclass('_User', User);
module.exports = {User};