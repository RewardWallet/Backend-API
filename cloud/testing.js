'use strict';

const Transaction = require('./Transaction').Transaction;
const Business = require('./Business').Business;

// Error handling function for cloud functions
function handleError(error, response) {

}

// Returns a _User object id
Parse.Cloud.define("createMockUser", function (request, response) {

    var user = new Parse.User();
    const name = Math.random().toString(36).substring(8);
    user.set("username", name);
    user.set("email", name + "@rewardwallet.com");

    // Password with at least 8 char with at least 1 lower case, 1 upper case and 1 digit
    user.set("password", "abc123ABC");



    user.signUp(null, {
        success: function (user) {
            response.success({"message": "Success", "objectId": user.id});
        },
        error: function (user, error) {
            response.error({"message": error.message, "code": error.code});
        }
    });
});

// Deletes a _User object
// Parameter Example:
// {
// 	"userId": "GEkx6rz7rD",
// }
Parse.Cloud.define("deleteUser", function (request, response) {

    const userId = request.params.userId;
    const query = new Parse.Query(Parse.User);
    query.get(userId)
        .then(function (user) {
            user.destroy({useMasterKey: true});
            response.success({"message": "Success"});
        })
        .catch(function (error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Returns a Business object id
Parse.Cloud.define("createMockBusiness", function (request, response) {

    var business = new Business();
    const username = Math.random().toString(36).substring(8);

    business.set("name", "Business " + Math.random().toString(36).substring(3));
    business.set("username", username);

    business.save(null, {
        success: function (business) {
            response.success({"message": "Success", "objectId": business.id});
        },
        error: function (user, error) {
            response.error({"message": error.message, "code": error.code});
        }
    });
});

// Deletes a Business object
// Parameter Example:
// {
// 	"businessId": "GEkx6rz7rD",
// }
Parse.Cloud.define("deleteBusiness", function (request, response) {

    const businessId = request.params.businessId;
    const query = new Parse.Query(Business);
    query.get(businessId)
        .then(function (business) {
            business.destroy({useMasterKey: true});
            response.success({"message": "Success"});
        })
        .catch(function (error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Deletes a Transaction object
// Parameter Example:
// {
// 	"transactionId": "GEkx6rz7rD",
// }
Parse.Cloud.define('deleteTransaction', function (request, response) {

    const transactionId = request.params.transactionId;
    const query = new Parse.Query(Transaction);
    query.get(transactionId, { useMasterKey: true }) // Ignore ACL
        .then(function (transaction) {
            transaction.destroy({useMasterKey: true})
                .then(function (result) {
                    response.success({"message": "Success"});
                })
                .catch(function (error) {
                    response.error({"message": error.message, "code": error.code});
                });
        })
        .catch(function (error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Deletes all transactions
Parse.Cloud.define("deleteAllTransactions", function (request, response) {

    const transactionQuery = new Parse.Query(Transaction);
    transactionQuery.find({ useMasterKey: true }) // Ignore ACL with MasterKey
        .then(function (results) {
            for (var i = 0; i < results.length; i++)
                results[i].destroy({useMasterKey: true}); // Ignore ACL with MasterKey
            response.success({"message": "Success"});
        })
        .catch(function (error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Deletes all businesses
Parse.Cloud.define("deleteAllBusinesses", function (request, response) {

    const businessQuery = new Parse.Query(Business);
    businessQuery.find()
        .then(function (results) {
            for (var i = 0; i < results.length; i++)
                results[i].destroy({useMasterKey: true}); // Ignore ACL with MasterKey
            response.success({"message": "Success"});
        })
        .catch(function (error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Deletes all users
Parse.Cloud.define("deleteAllUsers", function (request, response) {

    const handleError = function (error) {
        response.error({"message": error.message, "code": error.code});
    };

    // 1. Create a query for all users
    const userQuery = new Parse.Query(Parse.User);
    userQuery.find().then(function (results) {

        // 2. Create an array of async functions
        var promises = [];
        for (var i = 0; i < results.length; i++)
            promises.push(results[i].destroy({useMasterKey: true})); // Ignore ACL with MasterKey

        // 3. Execute async functions together and wait for all to complete
        Promise.all(promises).then(function (results) {
            response.success({"message": "Success"});
        }).catch(handleError)
    }).catch(handleError);
});

// Returns a count for the number of users
Parse.Cloud.define("countUsers", function (request, response) {

    const query = new Parse.Query(Parse.User);
    query.find({
        success: function (results) {
            response.success({"message": "Success", "count": results.length});
        },
        error: function (error) {
            response.error({"message": error.message, "code": error.code});
        }
    });
});

// Tests opening and closing a transaction by creating a mock user and business
// and then deleting them when complete
Parse.Cloud.define("testTransaction", function (request, response) {

    console.log("[Begin Transaction START]");

    // 1. Create the user
    console.log("> Creating User");
    Parse.Cloud.run("createMockUser")
        .then(function (result) {
            const userId = result.objectId;

            // 2. Create the business
            console.log("> Creating Business");
            Parse.Cloud.run("createMockBusiness", {})
                .then(function (result) {
                    const businessId = result.objectId;

                    // 3. Open a transaction
                    console.log("> Openning Transaction");
                    Parse.Cloud.run("openTransaction", {amount: 10.12, businessId: businessId})
                        .then(function (result) {
                            const transactionId = result.objectId;

                            // 4. Close the transaction
                            console.log("> Closing Transaction");
                            Parse.Cloud.run("closeTransaction", {transactionId: transactionId, userId: userId})
                                .then(function (result) {

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
                                })
                                .catch(function (error) {
                                    console.log("[Transaction Test FAILED]");
                                    response.error({"message": error.message, "code": error.code});
                                });
                        })
                        .catch(function (error) {
                            console.log("[Transaction Test FAILED]");
                            response.error({"message": error.message, "code": error.code});
                        });
                })
                .catch(function (error) {
                    console.log("[Transaction Test FAILED]");
                    response.error({"message": error.message, "code": error.code});
                });
        })
        .catch(function (error) {
            console.log("[Transaction Test FAILED]");
            response.error({"message": error.message, "code": error.code});
        });

});
