'use strict';

const User = require('./User').User;
const Transaction = require('./Transaction').Transaction;
const Business = require('./Business').Business;

// Introduces random error into the test suite to ensure error handling is correct
function randomError(response) {

    const isRandomErrorEnabled = false;

    const upperBound = 10;
    const lowerBound = 1;
    const number = Math.floor((Math.random() * upperBound) + lowerBound);

    if ((number === 5) && isRandomErrorEnabled) {
        // If the number was 5, trigger a random error
        handleTestError("Random Error Occurred", response);
        return false;
    } else {
        return true;
    }
}

function handleTestError(error, response) {
    const errorMessage = error.message.charAt(0).toUpperCase() + error.message.slice(1); // Capitalize first letter
    console.log('\x1b[31m%s\x1b[0m', errorMessage);
    response.error(errorMessage);
}

// Returns a _User object id
Parse.Cloud.define("createMockUser", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    if (!randomError(response)) { return } // Exit on random error

    var user = new User();
    const name = "mock-" + Math.random().toString(10).substring(8);
    user.set("username", name);
    user.set("email", name + "@rewardwallet.com");

    // Password with at least 8 char with at least 1 lower case, 1 upper case and 1 digit
    user.set("password", "abc123ABC");

    user.signUp().then(function (user) {
        response.success({"message": "Success", "objectId": user.id});
    }).catch(handleError);
});

// Deletes a _User object
// Parameter Example:
// {
// 	"userId": "GEkx6rz7rD",
// }
Parse.Cloud.define("deleteUser", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    if (!randomError(response)) { return } // Exit on random error

    const userId = request.params.userId;
    const query = new Parse.Query(User);
    query.get(userId).then(function (user) {
        Parse.Cloud.run("deleteSessions", { userId: user.objectId });
        user.destroy({useMasterKey: true}).then(function (result) {
            response.success({"message": "Success"});
        }).catch(handleError);
    }).catch(handleError);
});

// Returns a Business object id
Parse.Cloud.define("createMockBusiness", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    if (!randomError(response)) { return } // Exit on random error

    var business = new Business();

    let name = "mock-" + Math.random().toString(36).substring(3);
    business.set("name", "Business " + name);
    business.set("user", null);
    business.set("email", name + "@rewardwallet.com");

    const rewardModel = Math.floor((Math.random() * 3) + 1);
    business.set("rewardModel", rewardModel);
    if (rewardModel == 1) {
        business.set("cashBackPercent", 5);
    } else if (rewardModel == 2) {
        business.set("tokensPerItem", -1);
    } else if (rewardModel == 3) {
        business.set("giftCardPoints", 25);
        business.set("giftCardThreshhold", 10);
    }
    
    business.save().then(function (business) {
        response.success({"message": "Success", "objectId": business.id});
    }).catch(handleError);
});

// Deletes a Business object
// Parameter Example:
// {
// 	"businessId": "GEkx6rz7rD",
// }
Parse.Cloud.define("deleteBusiness", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    if (!randomError(response)) { return } // Exit on random error

    const businessId = request.params.businessId;
    const query = new Parse.Query(Business);
    query.get(businessId).then(function (business) {
        business.destroy({useMasterKey: true}).then(function (result) {
            response.success({"message": "Success"});
        }).catch(handleError);
    }).catch(handleError);
});

// Deletes a Transaction object
// Parameter Example:
// {
// 	"transactionId": "GEkx6rz7rD",
// }
Parse.Cloud.define('deleteTransaction', function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    if (!randomError(response)) { return } // Exit on random error

    const transactionId = request.params.transactionId;
    const query = new Parse.Query(Transaction);
    // Query using the master key to ignore ACL
    query.get(transactionId, { useMasterKey: true }).then(function (transaction) {
        transaction.destroy({useMasterKey: true}) // Destroy with master key to ignore ACL
            .then(function (result) {
                response.success({"message": "Success"});
            }).catch(handleError);
    }).catch(handleError);
});

// Deletes all transactions
Parse.Cloud.define("deleteAllTransactions", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    if (!randomError(response)) { return } // Exit on random error
    
    const transactionQuery = new Parse.Query(Transaction);
    // Query using the master key to ignore ACL
    transactionQuery.find({useMasterKey: true}).then(function (results) {

        // Create an array of async functions
        var promises = [];
        for (var i = 0; i < results.length; i++)
            promises.push(results[i].destroy({useMasterKey: true})); // Ignore ACL with MasterKey

        // Execute async functions together and wait for all to complete
        Promise.all(promises).then(function (results) {
            response.success({"message": "Success"});
        }).catch(handleError)
    }).catch(handleError);
});

// Deletes all businesses
Parse.Cloud.define("deleteAllBusinesses", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };
    
    const businessQuery = new Parse.Query(Business);
    businessQuery.find().then(function (results) {

        // Create an array of async functions
        var promises = [];
        for (var i = 0; i < results.length; i++)
            promises.push(results[i].destroy({useMasterKey: true})); // Ignore ACL with MasterKey

        // Execute async functions together and wait for all to complete
        Promise.all(promises).then(function (results) {
            response.success({"message": "Success"});
        }).catch(handleError)
    }).catch(handleError);
});

// Deletes all users
Parse.Cloud.define("deleteAllUsers", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    // 1. Create a query for all users
    const userQuery = new Parse.Query(User);
    userQuery.find().then(function (results) {

        // Create an array of async functions
        var promises = [];
        for (var i = 0; i < results.length; i++) {
            promises.push(Parse.Cloud.run("deleteSessions", { userId: results[i].objectId }));
            promises.push(Parse.Cloud.run("deleteInstallations", { userId: results[i].objectId }));
            promises.push(results[i].destroy({useMasterKey: true})); // Ignore ACL with MasterKey
        }
        // Execute async functions together and wait for all to complete
        Promise.all(promises).then(function (results) {
            response.success({"message": "Success"});
        }).catch(handleError)
    }).catch(handleError);
});

// Deletes a users session objects
// Example:
// {
// 	"userId": ha79onbAsu
// }
Parse.Cloud.define("deleteSessions", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    const userId = request.params.userId;

    const Session = Parse.Object.extend('_Session');
    const query = new Parse.Query(Session);
    query.equalTo('user', userId);
    query.find({useMasterKey: true}).then(function (results) {
        var promises = [];
        for (var i = 0; i < results.length; i++)
            promises.push(results[i].destroy({useMasterKey: true})); // Destroy with master key to ignore ACL
        Promise.all(promises).then(function (result) {
            response.success({"message": "Success"});
        }).catch(handleError)
    }).catch(handleError);
});

// Deletes all users
Parse.Cloud.define("deleteAllSessions", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    const Session = Parse.Object.extend('_Session');
    const query = new Parse.Query(Session);
    query.find({useMasterKey: true}).then(function (results) {
        var promises = [];
        for (var i = 0; i < results.length; i++)
            promises.push(results[i].destroy({useMasterKey: true})); // Destroy with master key to ignore ACL
        Promise.all(promises).then(function (result) {
            response.success({"message": "Success"});
        }).catch(handleError)
    }).catch(handleError);
});

// Deletes a users installation objects
// Example:
// {
// 	"userId": ha79onbAsu
// }
Parse.Cloud.define("deleteInstallations", function (request, response) {

    const handleError = function (error) { handleTestError(error, response); };

    const userId = request.params.userId;

    const Installation = Parse.Object.extend('_Installation');
    const query = new Parse.Query(Installation);
    query.equalTo('user', userId);
    query.find({useMasterKey: true}).then(function (results) {
        var promises = [];
        for (var i = 0; i < results.length; i++)
            promises.push(results[i].destroy({useMasterKey: true})); // Destroy with master key to ignore ACL
        Promise.all(promises).then(function (result) {
            response.success({"message": "Success"});
        }).catch(handleError)
    }).catch(handleError);
});

// Tests opening and closing a transaction by creating a mock user and business
// and then deleting them when complete
// If you don't want the test objects created, pass the following params:
// {
// 	"cleanUp": false
// }
Parse.Cloud.define("testTransaction", function (request, response) {

    const handleError = function (error) {
        console.log('\x1b[31m%s\x1b[0m', "[Transaction Test FAILED]");
        handleTestError(error, response);
    };

    const cleanup = !(typeof request.params.cleanup === 'undefined') ? request.params.cleanup : false;

    console.log("[Begin Transaction START]");

    // 1. Create the user
    console.log("> Creating User");
    Parse.Cloud.run("createMockUser").then(function (result) {
        const userId = result.objectId;

        // 2. Create the business
        console.log("> Creating Business");
        Parse.Cloud.run("createMockBusiness", {}).then(function (result) {
            const businessId = result.objectId;

            // 3. Open a transaction
            console.log("> Openning Transaction");
            Parse.Cloud.run("openTransaction", {amount: 10.12, itemCount: 2, businessId: businessId}).then(function (result) {
                const transactionId = result.objectId;

                // 4. Close the transaction
                console.log("> Closing Transaction");
                Parse.Cloud.run("closeTransaction", {transactionId: transactionId, userId: userId}).then(function (result) {

                    // 5. Delete the user and business
                    console.log('\x1b[32m%s\x1b[0m', "[Transaction Test COMPLETED]");
                    response.success({"message":"Success"});

                    if (cleanup === true) {
                        console.log("> Cleaning Up");

                        Parse.Cloud.run("deleteUser", {userId: userId}).then(function (result) {
                            console.log('\x1b[33m%s\x1b[0m', "> User " + userId + " deleted");
                        }).catch(function (error) {
                            console.log('\x1b[31m%s\x1b[0m', "[USER DELETE FAILED] " + error.message + " CODE: " + error.code);
                        });
                        Parse.Cloud.run("deleteBusiness", {businessId: businessId}).then(function (result) {
                            console.log('\x1b[33m%s\x1b[0m', "> Business " + businessId + " deleted");
                        }).catch(function (error) {
                            console.log('\x1b[31m%s\x1b[0m', "[BUSINESS DELETE FAILED] " + error.message + " CODE: " + error.code);
                        });
                        Parse.Cloud.run("deleteTransaction", {transactionId: transactionId}).then(function (result) {
                            console.log('\x1b[33m%s\x1b[0m', "> Transaction " + transactionId + " deleted");
                        }).catch(function (error) {
                            console.log('\x1b[31m%s\x1b[0m', "[TRANSACTION DELETE FAILED] " + error.message + " CODE: " + error.code);
                        });
                    } else {
                        console.log("> Ignoring Clean Up");
                    }

                }).catch(handleError);
            }).catch(handleError);
        }).catch(handleError);
    }).catch(handleError);
});
