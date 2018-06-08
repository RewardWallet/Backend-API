'use strict';

class Inventory extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Inventory');
        // All other initialization

        let name = Math.random().toString(36)
        let description = Math.random().toString(36)
        this.set("name", name);
        this.set("description", description);
    }

    setRewardModel(value) {
        this.set("rewardModel", value);
    }

    getRewardModel() {
        return !(typeof this.get("rewardModel") === 'undefined') ? this.get("rewardModel") : null;
    }

    setBusiness(value) {
        this.set("business", value);
    }

    getBusiness() {
        return !(typeof this.get("business") === 'undefined') ? this.get("business") : null;
    }

}

module.exports = {Inventory};