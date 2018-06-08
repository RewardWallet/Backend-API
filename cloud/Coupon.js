'use strict';

class Coupon extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Coupon');
        // All other initialization
    }

}

Parse.Object.registerSubclass('Coupon', Coupon);
module.exports = {Coupon};