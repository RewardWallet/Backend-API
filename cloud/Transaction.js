'use strict';

class Transaction extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Transaction');
        // All other initialization

        // Only read access to the transaction
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        this.setACL(acl);
    }

    setIsRedeeming(value) {
        this.set("isRedeeming", value);
    }

    isRedeeming() {
        return !(typeof this.get("isRedeeming") === 'undefined') ? this.get("isRedeeming") : false;
    }

    setRewardPointsRequired(value) {
        this.set("pointsRequired", value);
    }

    getRewardPointsRequired() {
        return !(typeof this.get("pointsRequired") === 'undefined') ? this.get("pointsRequired") : 0;
    }

    setDescription(value) {
        this.set("description", value);
    }

    getDescription() {
        return !(typeof this.get("description") === 'undefined') ? this.get("description") : "";
    }

    setAmount(value) {
        this.set("amount", value);
    }

    getAmount() {
        return !(typeof this.get("amount") === 'undefined') ? this.get("amount") : 0;
    }

    setBusiness(value) {
        this.set("business", value);
    }

    getBusiness() {
        return !(typeof this.get("business") === 'undefined') ? this.get("business") : null;
    }

    setItems(value) {
        this.set("items", value);
    }

    getItems() {
        return !(typeof this.get("items") === 'undefined') ? this.get("items") : [];
    }

    setItemCount(value) {
        this.set("itemCount", value);
    }

    getItemCount() {
        return !(typeof this.get("itemCount") === 'undefined') ? this.get("itemCount") : 0;
    }

    setUser(value) {
        this.set("user", value);
    }

    getUser() {
        return !(typeof this.get("user") === 'undefined') ? this.get("user") : null;
    }

}

Parse.Object.registerSubclass('Transaction', Transaction);
module.exports = {Transaction};