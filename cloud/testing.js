
// Returns a _User object id
Parse.Cloud.define("createMockUser", function(request, response) {

  var user = new Parse.User();
  const name = Math.random().toString(36).substring(8);
  user.set("username", name);
  user.set("email", name + "@rewardwallet.com");

  // Password with at least 8 char with at least 1 lower case, 1 upper case and 1 digit
  user.set("password", "abc123ABC");

  user.signUp(null, {
    success: function(user) {
      response.success({"message": "Success", "objectId": user.id});
    },
    error: function(user, error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Returns a Business object id
Parse.Cloud.define("createMockBusiness", function(request, response) {

  var Business = Parse.Object.extend("Business");
  var business = new Business();
  const username = Math.random().toString(36).substring(8);

  business.set("name", "Business " + Math.random().toString(36).substring(3));
  business.set("username", username);

  business.save(null, {
    success: function(business) {
      response.success({"message": "Success", "objectId": business.id});
    },
    error: function(user, error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Deletes all transactions
Parse.Cloud.define("deleteMockTransactions", function(request, response) {

  var Transaction = Parse.Object.extend("Transaction");
  const transactionQuery = new Parse.Query(Transaction);
  transactionQuery.find({
    success: function(results) {
      for (var i = 0; i < results.length; i++)
        results[i].destroy({ useMasterKey: true }); // Ignore ACL with MasterKey
      response.success({"message":"Success"})
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Deletes all businesses
Parse.Cloud.define("deleteMockBusinesses", function(request, response) {

  var Business = Parse.Object.extend("Business");
  const businessQuery = new Parse.Query(Business);
  businessQuery.find({
    success: function(results) {
      for (var i = 0; i < results.length; i++)
        results[i].destroy({ useMasterKey: true }); // Ignore ACL with MasterKey
        response.success({"message":"Success"})
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Deletes all users
Parse.Cloud.define("deleteMockUsers", function(request, response) {

  const userQuery = new Parse.Query(Parse.User);
  userQuery.find({
    success: function(results) {
      for (var i = 0; i < results.length; i++)
        results[i].destroy({ useMasterKey: true }); // Ignore ACL with MasterKey
     response.success({"message":"Success"})
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Returns a count for the number of users
Parse.Cloud.define("countUsers", function(request, response) {

  const query = new Parse.Query(Parse.User);
  query.find({
    success: function(results) {
      response.success({"message": "Success", "count": results.length});
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Tests openning and closing a transaction by creating a mock user and business
// and then deleting them when complete
Parse.Cloud.define("testTransaction", function(request, response) {

  console.log("[Begin Transaction Test]")

  // 1. Create the user
  console.log("> Creating User")
  Parse.Cloud.run("createMockUser", {})
    .then(function(result) {
        const userId = result.objectId

        // 2. Create the business
        console.log("> Creating Business")
        Parse.Cloud.run("createMockBusiness", {})
          .then(function(result) {
              const businessId = result.objectId

              // 3. Open a transaction
              console.log("> Openning Transaction")
              Parse.Cloud.run("openTransaction", { amount: 10.00, businessId: businessId })
                .then(function(result) {
                    const transactionId = result.objectId

                    // 4. Close the transaction
                    console.log("> Closing Transaction")
                    Parse.Cloud.run("closeTransaction", { transactionId: transactionId, userId: userId })
                      .then(function(result) {

                        // 5. Delete the user and business
                        console.log("> Cleaning Up")
                        Parse.Cloud.run("deleteMockUsers")
                        Parse.Cloud.run("deleteMockBusinesses")
                        Parse.Cloud.run("deleteMockTransactions")

                        console.log("[Transaction Test SUCCEEDED]")
                        response.success(result);

                      })
                      .catch(function(error) {
                        console.log("[Transaction Test FAILED]")
                        response.error({"message": error.message, "code": error.code});
                    });
                })
                .catch(function(error) {
                  console.log("[Transaction Test FAILED]")
                  response.error({"message": error.message, "code": error.code});
              });
          })
          .catch(function(error) {
            console.log("[Transaction Test FAILED]")
            response.error({"message": error.message, "code": error.code});
        });
    })
    .catch(function(error) {
      console.log("[Transaction Test FAILED]")
      response.error({"message": error.message, "code": error.code});
  });

});
