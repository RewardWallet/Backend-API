'use strict';

class Coupon extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Coupon');
        // All other initialization
    }

    setBusiness(value) {
        this.set("business", value);
    }

    getBusiness() {
        return !(typeof this.get("business") === 'undefined') ? this.get("business") : null;
    }

    setText(value) {
        this.set("text", value);
    }

    getText() {
        return !(typeof this.get("text") === 'undefined') ? this.get("text") : "";
    }

    setExpires(value) {
        this.set("expireDate", value);
    }

    getExpires() {
        return !(typeof this.get("expireDate") === 'undefined') ? this.get("expireDate") : null;
    }

}

Parse.Object.registerSubclass('Coupon', Coupon);
module.exports = {Coupon};