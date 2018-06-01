'use strict';

class User extends Parse.User {

    constructor() {
        // Pass the ClassName to the Parse.Object constructor
        super('_User');
        // All other initialization
    }

}

module.exports = {User};