'use strict';

const User = require('./User').User;
const Transaction = require('./Transaction').Transaction;
const Inventory = require('./Inventory').Inventory;
const Business = require('./Business').Business;
const DigitalCard = require('./DigitalCard').DigitalCard;
const RewardModel = require('./RewardModel').RewardModel;
const Coupon = require('./Coupon').Coupon;
const Notification = require('./Notification').Notification;

// Opens a transaction object for the business
// Parameter Example:
// {
// 	"amount": 10.00,
//  "itemCount": 3,
// 	"businessId": "GEkx6rz7rD"
// }
//
// OR
//
// {
//  "amount": 10.00,
//  "inventoryItems": ["GEkx6rz7rD","GEkx6rz7rD", "GEkx6rz7rD"],
// 	"businessId": "GEkx6rz7rD"
// }
// Returns a Transaction objects id
Parse.Cloud.define("openTransaction", function(request, response) {

    const amount = request.params.amount;
    var itemCount = request.params.itemCount;
    const inventoryItems = request.params.inventoryItems;
    const businessId = request.params.businessId;

    // 1. Check for undefined parameters

    if (typeof businessId === 'undefined')
        return response.error({"message":"'businessId' undefined"});

    if ((typeof inventoryItems === 'undefined') && (typeof amount !== 'undefined')) {
        if (typeof itemCount === 'undefined')
            return response.error({"message":"'itemCount' undefined"});
    } else if (typeof inventoryItems === 'undefined') {
        return response.error({"message":"'inventoryItems' undefined"});
    } else if (typeof  amount === 'undefined') {
        return response.error({"message":"'amount' undefined"});
    }

    if (typeof itemCount === 'undefined')
        itemCount = inventoryItems.length;

    // 2. Get the business object to assign as a pointer
    const query = new Parse.Query(Business);
    query.get(businessId)
        .then(function(business) {

            // 3. Create a new Transaction object and assign the amount and business owner
            const transaction = new Transaction();
            transaction.setAmount(amount);
            transaction.setBusiness(business);
            transaction.setItems(inventoryItems);
            transaction.setItemCount(itemCount);

            // 4. Save the transaction, MasterKey is not required for initial save
            transaction.save(null, { useMasterKey: true }).then(function (object) {
                response.success({"message": "Success", "objectId": object.id });
            }).catch(function (error) {
                response.error({"message": error.message, "code": error.code});
            });

        })
        .catch(function(error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Opens a transaction object for the business
// Parameter Example:
// {
// 	"points": 100,
// 	"businessId": "GEkx6rz7rD"
// }
// Returns a Transaction objects id
Parse.Cloud.define("openRedeemTransaction", function(request, response) {

    const points = request.params.points;
    const businessId = request.params.businessId;

    // 1. Check for undefined parameters
    if (typeof points === 'undefined')
        return response.error({"message":"'points' undefined"});

    if (typeof businessId === 'undefined')
        return response.error({"message":"'businessId' undefined"});

    // 2. Get the business object to assign as a pointer
    const query = new Parse.Query(Business);
    query.get(businessId)
        .then(function(business) {

            // 3. Create a new Transaction object and assign the amount and business owner
            const transaction = new Transaction();
            transaction.setIsRedeeming(true);
            transaction.setBusiness(business);
            transaction.setRewardPointsRequired(points);

            // 4. Save the transaction, MasterKey is not required for initial save
            transaction.save(null, { useMasterKey: true }).then(function (object) {
                response.success({"message": "Success", "objectId": object.id });
            }).catch(function (error) {
                response.error({"message": error.message, "code": error.code});
            });

        })
        .catch(function(error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Closes a transaction object for the business and assigns it to a user
// Parameter Example:
// {
// 	"transactionId": "27hHA8ia2",
// 	"userId": "GEkx6rz7rD"
// }
Parse.Cloud.define("closeTransaction", function(request, response) {

    const transactionId = request.params.transactionId;
    const userId = request.params.userId;

    // 1. Check for undefined parameters
    if (typeof transactionId === 'undefined')
        return response.error({"message":"Undefined Transaction ID"});

    if (typeof userId === 'undefined')
        return response.error({"message":"Undefined User"});

    // 2. Get the user object to assign as a pointer
    const query = new Parse.Query(User);
    query.get(userId, { useMasterKey: true }).then(function(user) {

        // 3. Create a query for the transaction, MasterKey required due to ACL
        const query = new Parse.Query(Transaction);
        query.include("business");
        query.get(transactionId, { useMasterKey: true }).then(function(transaction) {

            // 4. Transactions cannot be overritten once closed
            if (transaction.getUser() != null)
                return response.error({"message":"That transaction has already been closed"});

            // 5. Assign a user pointer to the transaction
            transaction.setUser(user);

            const businessId = transaction.getBusiness().id;

            // 6. Get the business distribution model
            const query = new Parse.Query(Business);
            query.include("rewardModel");
            query.include("rewardModel.coupon");
            query.get(businessId, { useMasterKey: true })
                .then(function(business) {

                    const rewardModel = business.get("rewardModel");

                    if (rewardModel == null)
                        return response.error({"message":"Business reward distribution model not set"});

                    const allocatePoints = function(points, user, transaction) {
                        // 7. Update the points
                        const query = new Parse.Query(DigitalCard);
                        query.equalTo('user', user);
                        query.equalTo('business', transaction.getBusiness());
                        query.find({ useMasterKey: true }).then(function (results) {

                            // Create an array of async functions
                            var promises = [];

                            if (results.length == 0) {
                                const digitalCard = new DigitalCard();
                                digitalCard.setUser(user);
                                digitalCard.setBusiness(transaction.getBusiness());
                                digitalCard.addPoints(points);
                                promises.push(digitalCard.save(null, { useMasterKey: true }))
                            } else {
                                for (var i = 0; i < results.length; i++) {
                                    results[i].addPoints(points);
                                    promises.push(results[i].save(null, { useMasterKey: true }));
                                }
                            }

                            // Execute async functions together and wait for all to complete
                            Promise.all(promises).then(function (results) {

                                // Done updating point values
                                // 8. Save the transaction, again using the MasterKey due to ACL
                                transaction.save(null, { useMasterKey: true } )
                                    .then(function () {
                                        response.success({"message":"Success", "pointsAdded": points});
                                    })
                                    .catch(function (error) {
                                        response.error({"message": error.message, "code": error.code});
                                    })
                            }).catch(function (error) {
                                response.error({"message": error.message, "code": error.code});
                            })
                        }).catch(function (error) {
                            response.error({"message": error.message, "code": error.code});
                        });
                    };

                    const calculateNewPoints = function(rewardModel, transaction, item) {

                        var points = 0;

                        // 1. Cash Back %
                        // 2. Token
                        // 3. Gift Card
                        // 4. Coupon
                        // 5. Inventory
                        const type = rewardModel.getType();
                        const price = (transaction != null) ? transaction.getAmount() : item.get("price");

                        if (type == 1) {
                            points = price * rewardModel.getCashBackPercent() / 100;
                        } else if (type == 2) {
                            if (rewardModel.getTokensPerItem() < 0) {
                                points = -rewardModel.getTokensPerItem(); // negative ignores item count
                            } else {
                                if (transaction != null) {
                                    points = rewardModel.getTokensPerItem() * transaction.getItemCount();
                                } else {
                                    points = rewardModel.getTokensPerItem(); // for inventory item
                                }
                            }
                        } else if (type == 3) {
                            if (price >= rewardModel.getGiftCardThreshold()) {
                                points = rewardModel.getGiftCardPoints();
                            } else {
                                throw response.error({"message":"Did not meet threshold transaction amount of " + rewardModel.getGiftCardThreshold()});
                            }
                        } else if (rewardModel.getType() == 4) {

                            if (rewardModel.getCoupon() != null) {
                                user.availableCoupons().add(rewardModel.getCoupon());
                                user.save(null, { useMasterKey: true })
                            } else {
                                throw response.error({"message":"RewardModel does not contain a coupon"});
                            }
                        }
                        return Math.round(points * 100) / 100; // Round to two decimals
                    };

                    if ((rewardModel.getType() < 1) || (rewardModel.getType() > 5)) {
                        throw response.error({"message":"Unknown reward distribution model"});

                    } else if (rewardModel.getType() == 4) {

                        if (rewardModel.getCoupon() != null) {
                            transaction.setDescription("Awarded a coupon");
                            user.availableCoupons().add(rewardModel.getCoupon());
                            user.save(null, { useMasterKey: true }).then(function (user) {
                                allocatePoints(0, user, transaction, null);
                            }).catch(function (error) {
                                response.error({"message": error.message, "code": error.code});
                            })
                        } else {
                            return response.error({"message":"RewardModel does not contain a coupon"});
                        }
                    } else if (rewardModel.getType() == 5) {

                        // Query for inventory objects
                        const query = new Parse.Query(Inventory);
                        query.include("rewardModel");
                        query.include("rewardModel.coupon");
                        query.containedIn("objectId", transaction.getItems());
                        query.find({ useMasterKey: true }).then(function (items) {

                            var points = 0;
                            for (var i = 0; i < items.length; i++) {
                                const rewardModel = items[i].get("rewardModel");
                                if (rewardModel != null) {
                                    let repeatedCount = transaction.getItems().filter(function (str) { return str == items[i].id; }).length;
                                    const newPoints = calculateNewPoints(rewardModel, null, items[i]) * repeatedCount;
                                    points = points + newPoints;
                                } else {
                                    console.log("Inventory object " + items[i].id + " did not have an assigned RewardModel")
                                }
                            }
                            transaction.setDescription("Awarded " + points + " reward points");
                            allocatePoints(points, user, transaction);

                        }).catch(function (error) {
                            response.error({"message": error.message, "code": error.code});
                        });
                    } else {
                        const points = calculateNewPoints(rewardModel, transaction)
                        transaction.setDescription("Awarded a " + points + " reward points");
                        allocatePoints(points, user, transaction);
                    }

                }).catch(function (error) {
                response.error({"message": error.message, "code": error.code});
            })
        }).catch(function(error) {
            response.error({"message": error.message, "code": error.code});
        });
    })
        .catch(function(error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Closes a transaction object for the business and assigns it to a user
// Parameter Example:
// {
// 	"transactionId": "27hHA8ia2",
// 	"userId": "GEkx6rz7rD"
// }
Parse.Cloud.define("closeRedeemTransaction", function(request, response) {

    const transactionId = request.params.transactionId;
    const userId = request.params.userId;

    // 1. Check for undefined parameters
    if (typeof transactionId === 'undefined')
        return response.error({"message":"Undefined Transaction ID"});

    if (typeof userId === 'undefined')
        return response.error({"message":"Undefined User"});

    // 2. Get the user object to assign as a pointer
    const query = new Parse.Query(User);
    query.get(userId, { useMasterKey: true }).then(function(user) {

        // 3. Create a query for the transaction, MasterKey required due to ACL
        const query = new Parse.Query(Transaction);
        query.include("business");
        query.get(transactionId, { useMasterKey: true }).then(function(transaction) {

            // 4. Transactions cannot be overritten once closed
            if (transaction.getUser() != null)
                return response.error({"message":"That transaction has already been closed"});

            // 5. Assign a user pointer to the transaction
            transaction.setUser(user);

            // 7. Update the points
            const query = new Parse.Query(DigitalCard);
            query.equalTo('user', user);
            query.equalTo('business', transaction.getBusiness());
            query.find({ useMasterKey: true }).then(function (results) {

                // Create an array of async functions
                var promises = [];

                if (results.length == 0) {
                    return response.error({"message":"User does not have a digital card for the business"});
                } else {
                    for (var i = 0; i < results.length; i++) {

                        if ((results[i].getPoints() - transaction.getRewardPointsRequired()) < 0) {
                            return response.error({"message":"User does not have enough points"});
                        } else {
                            results[i].subtractPoints(transaction.getRewardPointsRequired());
                            promises.push(results[i].save(null, { useMasterKey: true }));
                        }
                    }
                }

                // Execute async functions together and wait for all to complete
                Promise.all(promises).then(function (results) {

                    // Done updating point values
                    // 8. Save the transaction, again using the MasterKey due to ACL
                    transaction.save(null, { useMasterKey: true } )
                        .then(function () {
                            response.success({"message":"Success", "pointsRedeemed": transaction.getRewardPointsRequired()});
                        })
                        .catch(function (error) {
                            response.error({"message": error.message, "code": error.code});
                        })
                }).catch(function (error) {
                    response.error({"message": error.message, "code": error.code});
                })
            }).catch(function (error) {
                response.error({"message": error.message, "code": error.code});
            });

        }).catch(function(error) {
            response.error({"message": error.message, "code": error.code});
        });
    })
        .catch(function(error) {
            response.error({"message": error.message, "code": error.code});
        });
});

// Send a notification to the user of the transaction
Parse.Cloud.afterSave("Transaction", function(request) {

    const query = new Parse.Query(Transaction);
    query.include("business");
    query.include("user");
    query.exists("user");
    query.get(request.object.id,  { useMasterKey: true }).then(function(transaction) {
        if (transaction.getUser() != null) {

            var message = "";

            if (transaction.isRedeeming()) {
                message = "You redeemed " + transaction.getRewardPointsRequired() + " at " + transaction.getBusiness().getName();
            } else {
                message = "Thank you for your purchase of $" + transaction.getAmount() + " at " + transaction.getBusiness().getName();
            }


            Parse.Cloud.run("pushToUser", { user: transaction.getUser().id, message: message });

            const notification = new Notification();
            notification.setUser(transaction.getUser())
            notification.setDescription(message);
            notification.save().then(function (result) {
                console.log("> Notification Sent")
            });

        }
    }).catch(function(error) {
        console.error("Got an error " + error.code + " : " + error.message);
    });
});
