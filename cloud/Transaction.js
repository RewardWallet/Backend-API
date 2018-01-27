'use strict';

class Transaction extends Parse.Object {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('Transaction');
        // All other initialization
    }

}

module.exports = {Transaction};