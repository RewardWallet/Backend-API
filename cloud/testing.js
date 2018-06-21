'use strict';

const User = require('./User').User;
const Transaction = require('./Transaction').Transaction;
const Inventory = require('./Inventory').Inventory;
const Business = require('./Business').Business;
const DigitalCard = require('./DigitalCard').DigitalCard;
const RewardModel = require('./RewardModel').RewardModel;
const Coupon = require('./Coupon').Coupon;

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

function sleep(seconds) {
    var e = new Date().getTime() + (seconds * 1000);
    while (new Date().getTime() <= e) {}
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

    const business = new Business();

    let name = "mock-" + Math.random().toString(36).substring(3);
    business.set("name", "Business " + name);
    business.set("user", null);
    business.set("email", name + "@rewardwallet.com");
    business.set("address", "Vancouver, BC");

    business.save().then(function (business) {

        const randomRewardModel = function(min, max, callback) {
            const rewardModel = new RewardModel();
            const type = (min == max) ? min : Math.floor((Math.random() * max) + min);
            rewardModel.setType(type);

            if (type == 1) {
                rewardModel.setCashBackPercent(Math.floor((Math.random() * 100) + 10)/10);
                callback(rewardModel);
            } else if (type == 2) {
                rewardModel.setTokensPerItem(Math.floor((Math.random() * 100) - 100));
                callback(rewardModel);
            } else if (type == 3) {
                rewardModel.setGiftCardPoints(Math.floor((Math.random() * 10000) + 2500)/100);
                rewardModel.setGiftCardThreshold(Math.floor((Math.random() * 50) + 10))
                callback(rewardModel);
            } else if (type == 4) {

                const coupon = new Coupon();
                coupon.setBusiness(business);
                coupon.setText("10% Off Any Purchase of $25 or more");
                var now = new Date();
                coupon.setExpires(now.getDate()+14);
                coupon.save().then(function (coupon) {
                    rewardModel.setCoupon(coupon);
                    callback(rewardModel);
                }).catch(handleError)
            } else if (type == 5) {

                callback(rewardModel);
            }
        }

        const saveRewardModelAndSetToBusiness = function(rewardModel, business) {
            rewardModel.save(null, { useMasterKey: true } ).then(function (rewardModel) {
                business.setRewardModel(rewardModel);
                business.save().then(function (business) {

                    if (rewardModel.getType() == 5) {

                        const count = Math.floor((Math.random() * 6) + 2)
                        console.log("> Creating " + count + " inventory items");
                        var promises = [];
                        for (var i = 0; i < count; i++) {
                            const item = new Inventory();
                            item.setBusiness(business);
                            const price = Math.floor((Math.random() * 5000) + 100)/100;
                            item.setPrice(price);
                            promises.push(item.save());
                        }
                        // Execute async functions together and wait for all to complete
                        Promise.all(promises).then(function (items) {
                            var promises = [];
                            for (var i = 0; i < count; i++) {
                                randomRewardModel(1, 4, function (rewardModel) {
                                    promises.push(rewardModel.save(null, { useMasterKey: true } ))

                                    if (promises.length == count) {
                                        Promise.all(promises).then(function (rewardModels) {
                                            var promises = [];
                                            var itemIds = [];
                                            for (var i = 0; i < items.length; i++) {
                                                items[i].setRewardModel(rewardModels[i]);
                                                itemIds.push(items[i].id);
                                                promises.push(items[i].save(null, { useMasterKey: true }));
                                            }
                                            Promise.all(promises).then(function (items) {
                                                console.log(itemIds);
                                                response.success({"message": "Success", "objectId": business.id, "itemIds": itemIds});
                                            });
                                        });
                                    }
                                })
                            }

                        })

                    } else {
                        response.success({"message": "Success", "objectId": business.id});
                    }

                }).catch(handleError);
            }).catch(handleError);
        };

        // Generate a RewardModel for the business
        randomRewardModel(1, 5, function (rewardModel) {
            saveRewardModelAndSetToBusiness(rewardModel, business);
        });

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

    const cleanup = !(typeof request.params.cleanup === 'undefined') ? request.params.cleanup : true;

    console.log("[Begin Transaction START]");

    // 1. Create the user
    console.log("> Creating User");
    Parse.Cloud.run("createMockUser").then(function (result) {
        const userId = result.objectId;

        // 2. Create the business
        console.log("> Creating Business");
        Parse.Cloud.run("createMockBusiness", {}).then(function (result) {
            const businessId = result.objectId;
            const itemIds = result.itemIds;

            // 3. Open a transaction
            console.log("> Openning Transaction");
            const amount = Math.floor((Math.random() * 5000) + 100)/100;
            const count = !(typeof itemIds === 'undefined') ? itemIds.length : Math.floor((Math.random() * 5) + 1);
            console.log("Transaction Amount: " + amount + ", count: " + count);
            Parse.Cloud.run("openTransaction", {amount: amount, itemCount: count, businessId: businessId, items: itemIds}).then(function (result) {

                const transactionId = result.objectId;

                // 4. Close the transaction
                console.log("> Closing Transaction");
                Parse.Cloud.run("closeTransaction", {transactionId: transactionId, userId: userId}).then(function (result) {

                    const pointsAdded = result.pointsAdded;

                    console.log("> Openning Redeem Transaction");
                    console.log("Redeeming:  " + pointsAdded);
                    Parse.Cloud.run("openRedeemTransaction", {points: pointsAdded, businessId: businessId}).then(function (result) {

                        const redeemTransactionId = result.objectId;

                        console.log("> Closing Redeem Transaction");
                        Parse.Cloud.run("closeRedeemTransaction", {transactionId: redeemTransactionId, userId: userId}).then(function (result) {

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
                                Parse.Cloud.run("deleteTransaction", {transactionId: redeemTransactionId}).then(function (result) {
                                    console.log('\x1b[33m%s\x1b[0m', "> Transaction " + redeemTransactionId + " deleted");
                                }).catch(function (error) {
                                    console.log('\x1b[31m%s\x1b[0m', "[TRANSACTION DELETE FAILED] " + error.message + " CODE: " + error.code);
                                });
                            } else {
                                console.log("> Ignoring Clean Up");
                            }
                        });
                    });

                }).catch(handleError);
            }).catch(handleError);
        }).catch(handleError);
    }).catch(handleError);
});
