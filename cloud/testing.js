'use strict';

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
        response.error({"message":"Random Error Occurred"});
        return false;
    } else {
        return true;
    }
}

// Returns a _User object id
Parse.Cloud.define("createMockUser", function (request, response) {

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

    if (!randomError(response)) { return } // Exit on random error

    var user = new Parse.User();
    const name = Math.random().toString(36).substring(8);
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

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

    if (!randomError(response)) { return } // Exit on random error

    const userId = request.params.userId;
    const query = new Parse.Query(Parse.User);
    query.get(userId).then(function (user) {
        user.destroy({useMasterKey: true}).then(function (result) {
            response.success({"message": "Success"});
        }).catch(handleError);
    }).catch(handleError);
});

// Returns a Business object id
Parse.Cloud.define("createMockBusiness", function (request, response) {

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

    if (!randomError(response)) { return } // Exit on random error

    var business = new Business();
    business.set("name", "Business " + Math.random().toString(36).substring(3));
    business.set("username", Math.random().toString(36).substring(8));
    
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

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

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

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

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

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

    if (!randomError(response)) { return } // Exit on random error
    
    const transactionQuery = new Parse.Query(Transaction);
    // Query using the master key to ignore ACL
    transactionQuery.then(function (results) {

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

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };
    
    const businessQuery = new Parse.Query(Business);
    businessQuery.then(function (results) {

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

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

    // 1. Create a query for all users
    const userQuery = new Parse.Query(Parse.User);
    userQuery.find().then(function (results) {

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

// Returns a count for the number of users
Parse.Cloud.define("countUsers", function (request, response) {

    const query = new Parse.Query(Parse.User);
    query.find().then(function (results) {
        response.success({"message": "Success", "count": results.length});
    }).catch(function (error) {
        response.error({"message": error.message, "code": error.code});
    });
});

// Tests opening and closing a transaction by creating a mock user and business
// and then deleting them when complete
Parse.Cloud.define("testTransaction", function (request, response) {

    const handleError = function (error) {
        console.log("[Transaction Test FAILED]");
        response.error({"message": error.message, "code": error.code});
    };

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
            Parse.Cloud.run("openTransaction", {amount: 10.12, businessId: businessId}).then(function (result) {
                const transactionId = result.objectId;

                // 4. Close the transaction
                console.log("> Closing Transaction");
                Parse.Cloud.run("closeTransaction", {transactionId: transactionId, userId: userId}).then(function (result) {

                    // 5. Delete the user and business
                    console.log("> Transaction Test Passed");
                    console.log("> Cleaning Up");
                    console.log("> Deleting User");
                    Parse.Cloud.run("deleteUser", {userId: userId})
                        .then(function (result) {

                            console.log("> Deleting Business");
                            Parse.Cloud.run("deleteBusiness", {businessId: businessId})
                                .then(function (result) {

                                    console.log("> Deleting Transaction");
                                    Parse.Cloud.run("deleteTransaction", {transactionId: transactionId})
                                        .then(function (result) {

                                            console.log("[Transaction Test COMPLETED]");
                                            response.success(result);
                                        })
                                        .catch(function (error) {
                                            console.log("[Transaction Test TRANSACTION DELETE FAILED]");
                                            response.error({"message": error.message, "code": error.code});
                                        });
                                })
                                .catch(function (error) {
                                    console.log("[Transaction Test BUSINESS DELETE FAILED]");
                                    response.error({"message": error.message, "code": error.code});
                                });
                        })
                        .catch(function (error) {
                            console.log("[Transaction Test USER DELETE FAILED]");
                            response.error({"message": error.message, "code": error.code});
                        });
                    }).catch(handleError);
                }).catch(handleError);
        }).catch(handleError);
    }).catch(handleError);
});
