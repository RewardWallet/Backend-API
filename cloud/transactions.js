'use strict';

const User = require('./User').User;
const Transaction = require('./Transaction').Transaction;
const Inventory = require('./Inventory').Inventory;
const Business = require('./Business').Business;
const DigitalCard = require('./DigitalCard').DigitalCard;

// Opens a transaction object for the business
// Parameter Example:
// {
// 	"amount": 10.00,
//  "itemCount": 3,
//  "inventoryItems": ["GEkx6rz7rD","GEkx6rz7rD", "GEkx6rz7rD"], (OPTIONAL)
// 	"businessId": "GEkx6rz7rD"
// }
// Returns a Transaction objects id
Parse.Cloud.define("openTransaction", function(request, response) {

    const amount = request.params.amount;
    const itemCount = request.params.itemCount;
    const inventoryItems = request.params.inventoryItems;
    const businessId = request.params.businessId;

    // 1. Check for undefined parameters
    if (typeof amount === 'undefined')
        return response.error({"message":"'amount' undefined"});

    if (typeof itemCount === 'undefined')
        return response.error({"message":"'itemCount' undefined"});

    if (typeof businessId === 'undefined')
        return response.error({"message":"'businessId' undefined"});

    if ((typeof inventoryItems !== 'undefined') && (inventoryItems.length != itemCount))
        return response.error({"message":"'itemCount' does not match number of 'inventoryItems'"});

    // 2. Get the business object to assign as a pointer
    const query = new Parse.Query(Business);
    query.get(businessId)
    .then(function(business) {

      // 3. Create a new Transaction object and assign the amount and business owner
      var transaction = new Transaction();
      transaction.set("amount", amount);
      transaction.set("business", business);
      transaction.set("itemCount", itemCount);
      transaction.set("items", inventoryItems);

      // 4. Only read access to the transaction
      var acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      transaction.setACL(acl);

      // 5. Save the transaction, MasterKey is not required for initial save
      transaction.save(null, {
        success: function(transaction) {
          response.success({"message": "Success", "objectId": transaction.id });
        },
        error: function(transaction, error) {
          response.error({"message": error.message, "code": error.code});
        }
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
    query.get(userId)
    .then(function(user) {

      // 3. Create a query for the transaction, MasterKey required due to ACL
      const query = new Parse.Query(Transaction);
      query.include("business");
      query.get(transactionId, { useMasterKey: true })
        .then(function(transaction) {

            // 4. Transactions cannot be overritten once closed
            if (typeof transaction.get("user") !== 'undefined')
                return response.error({"message":"That transaction has already been closed"});

            // 5. Assign a user pointer to the transaction
            transaction.set("user", user);

            const businessId = transaction.get("business").id;

            // 6. Get the business distribution model
            const query = new Parse.Query(Business);
            query.get(businessId, { useMasterKey: true })
                .then(function(business) {

                    const rewardModel = business.get("rewardModel");
                    console.log(rewardModel);
                    if (typeof rewardModel === 'undefined')
                        return response.error({"message":"Business reward distribution model not set"});

                    var newPoints = 0;

                    const transactionAmount = !(typeof transaction.get("amount") === 'undefined') ? transaction.get("amount") : 0;
                    const transactionItemCount = !(typeof transaction.get("itemCount") === 'undefined') ? transaction.get("itemCount") : 0;
                    const transactionItems = !(typeof transaction.get("items") === 'undefined') ? transaction.get("items") : [];

                    // 1. Cash Back %
                    // 2. Token
                    // 3. Gift Card
                    // 4. Coupon
                    // 5. Inventory
                    if (rewardModel == 1) {
                        const percent = business.get("cashBackPercent");
                        if (typeof percent === 'undefined')
                            return response.error({"message":"'cashBackPercent' undefined"});
                        newPoints = transactionAmount * percent / 100;
                    } else if (rewardModel == 2) {
                        const tokensPerItem = business.get("tokensPerItem");
                        if (typeof tokensPerItem === 'undefined')
                            return response.error({"message":"'tokensPerItem' undefined"});
                        if (tokensPerItem == -1) {
                            newPoints = 1; // -1 is code for 1 point regardless of item count
                        } else {
                            newPoints = tokensPerItem * transactionItemCount;
                        }
                    } else if (rewardModel == 3) {
                        const giftCardPoints = business.get("giftCardPoints");
                        if (typeof giftCardPoints === 'undefined')
                            return response.error({"message":"'giftCardPoints' undefined"});
                        const giftCardThreshhold = business.get("giftCardThreshhold");
                        if (typeof giftCardPoints === 'undefined')
                            return response.error({"message":"'giftCardThreshhold' undefined"});
                        if (transactionAmount >= giftCardThreshhold) {
                            newPoints = giftCardPoints;
                        } else {
                            newPoints = 0; // Did not meet threshhold
                        }
                    } else if (rewardModel == 4) {

                    } else if (rewardModel == 5) {

                    }

                    newPoints = Math.round(newPoints * 100) / 100;

                    // 7. Update the points
                    const query = new Parse.Query(DigitalCard);
                    query.equalTo('user', user);
                    query.equalTo('business', transaction.get("business"));
                    query.find({useMasterKey: true}).then(function (results) {

                        // Create an array of async functions
                        var promises = [];

                        if (results.length == 0) {
                            let digitalCard = new DigitalCard();
                            digitalCard.set('user', user);
                            digitalCard.set('business', transaction.get("business"));
                            digitalCard.set('points', newPoints);
                            promises.push(digitalCard.save())
                        } else {
                            for (var i = 0; i < results.length; i++) {

                                if (typeof results[i].get("points") === 'undefined') {
                                    results[i].set("points", newPoints);
                                } else {
                                    results[i].set("points", results[i].get("points") + newPoints);
                                }
                                promises.push(results[i].save());
                            }
                        }

                        // Execute async functions together and wait for all to complete
                        Promise.all(promises).then(function (results) {

                            // Done updating point values
                            // 8. Save the transaction, again using the MasterKey due to ACL
                            transaction.save(null, {useMasterKey: true})
                                .then(function () {
                                    response.success({"message":"Success", "pointsAdded": newPoints});
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


                }).catch(function (error) {
                response.error({"message": error.message, "code": error.code});
            })

        })
        .catch(function(error) {
          response.error({"message": error.message, "code": error.code});
      });
    })
    .catch(function(error) {
      response.error({"message": error.message, "code": error.code});
    });
    });

    // Send a notification to the user of the transaction
    // Parse.Cloud.afterSave("Transaction", function(request) {
    //
    //   const query = new Parse.Query(Transaction);
    //   query.include("business");
    //   query.get(request.object.id)
    //     .then(function(transaction) {
    //       var userId = transaction.user
    //       if (typeof userId !== 'undefined')
    //       {
    //         var amount = transaction.amount
    //         var businessName = transaction.business.name
    //         var message = "Thank you for your purchase of $" + amount + " at " + businessName;
    //         Parse.Cloud.run("pushToUser", { user: userId, message: message });
    //       }
    //     })
    //     .catch(function(error) {
    //       console.error("Got an error " + error.code + " : " + error.message);
    //     });
    // });
