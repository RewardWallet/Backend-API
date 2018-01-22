
Parse.Cloud.define("createMockUser", function(request, response) {

  var user = new Parse.User();
  const name = Math.random().toString(36).substring(8);
  user.set("username", name);
  user.set("email", name + "@rewardwallet.com");

  // Password with at least 8 char with at least 1 lower case, 1 upper case and 1 digit
  user.set("password", "abc123ABC");

  user.signUp(null, {
    success: function(user) {
      response.success({"message": "Created user with objectId " + user.id, "code": 200});
    },
    error: function(user, error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

Parse.Cloud.define("createMockBusiness", function(request, response) {

  var Business = Parse.Object.extend("Business");
  var business = new Business();
  const username = Math.random().toString(36).substring(8);

  business.set("name", "Business " + Math.random().toString(36).substring(3));
  business.set("username", username);

  business.save(null, {
    success: function(business) {
      response.success({"message": "Created business with objectId " + business.id, "code": 200});
    },
    error: function(user, error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

Parse.Cloud.define("deleteMockTransactions", function(request, response) {

  var Transaction = Parse.Object.extend("Transaction");
  const transactionQuery = new Parse.Query(Transaction);
  transactionQuery.find({
    success: function(results) {
      for (var i = 0; i < results.length; i++)
        results[i].destroy({ useMasterKey: true });
      response.success({"message":"Done"})
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

Parse.Cloud.define("deleteMockBusinesses", function(request, response) {

  var Business = Parse.Object.extend("Business");
  const businessQuery = new Parse.Query(Business);
  businessQuery.find({
    success: function(results) {
      for (var i = 0; i < results.length; i++)
        results[i].destroy({ useMasterKey: true });
        response.success({"message":"Done"})
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

Parse.Cloud.define("deleteMockUsers", function(request, response) {

  const userQuery = new Parse.Query(Parse.User);
  userQuery.find({
    success: function(results) {
      for (var i = 0; i < results.length; i++)
        results[i].destroy({ useMasterKey: true });
     response.success({"message":"Done"})
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

Parse.Cloud.define("countUsers", function(request, response) {

  const query = new Parse.Query(Parse.User);
  query.find({
    success: function(results) {
      response.success({"message": "Success", "code": 200, "count": results.length});
    },
    error: function(error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Tests openning and closing a transaction by creating a mock user and business
// and then deleting them when complete
Parse.Cloud.define("testTransaction", function(request, response) {

  // 1. Create the user
  Parse.Cloud.run("hello", {}).then(function(result) {
      console.log(result);
  }, function(error) {
      console.error(error);
  });

});
