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

Parse.Object.registerSubclass('Business', Business);
module.exports = {Business};