

class Transaction extends Parse.Object {

  constructor() {
    // Pass the ClassName to the Parse.Object constructor
    super('Transaction');
    // All other initialization
  }

}

// Opens a transaction object for the business
// Parameter Example:
// {
// 	"amount": 10.00,
// 	"business": {
// 		"__type": "Pointer",
// 		"objectId": "GEkx6rz7rD",
// 		"className": "Business",
// 	}
// }
Parse.Cloud.define("beginTransaction", function(request, response) {

  const amount = request.params.amount;
  const business = request.params.business;

  // 1. Check for undefined parameters
  if (typeof amount == 'undefined')
    return response.error({"message":"Undefined transaction amount"});

  if (typeof business == 'undefined')
    return response.error({"message":"Undefined business pointer"});

  // 2. Create a new Transaction object and assign the amount and business owner
  var transaction = new Transaction();
  transaction.set("amount", amount)
  transaction.set("business", business)

  // 3. Only the business has read access to the transaction
  var acl = new Parse.ACL();
  acl.setReadAccess(business.objectId, true); // Only the business can read
  transaction.setACL(acl);

  // 4. Save the transaction, MasterKey is not required for initial save
  transaction.save(null, {
    success: function(transaction) {
      response.success({"message": "Created a transaction with objectId " + transaction.id, "code": 200, "transactionId": transaction.id });
    },
    error: function(transaction, error) {
      response.error({"message": error.message, "code": error.code});
    }
  });
});

// Closes a transaction object for the business and assigns it to a user
// Parameter Example:
// {
// 	"transactionId": 27hHA8ia2,
// 	"user": {
// 		"__type": "Pointer",
// 		"objectId": "GEkx6rz7rD",
// 		"className": "_User",
// 	}
// }
Parse.Cloud.define("closeTransaction", function(request, response) {

  const transactionId = request.params.transactionId;
  const user = request.params.user;

  // 1. Check for undefined parameters
  if (typeof transactionId == 'undefined')
    return response.error({"message":"Undefined transaction ID"});

  if (typeof user == 'undefined')
    return response.error({"message":"Undefined user pointer"});

  // 2. Create a query for the transaction, MasterKey required due to ACL
  const query = new Parse.Query(Transaction);
  query.get(transactionId, { useMasterKey: true })
    .then(function(transaction) {

      // 3. Transactions cannot be overritten once closed
      if (typeof transaction.get("user") != 'undefined')
        return response.error({"message":"Requested transaction is already closed"});

      // 4. Assign a user pointer to the transaction
      transaction.set("user", user);

      // 5. Save the transaction, again using the MasterKey due to ACL
      transaction.save(null, { useMasterKey: true })
        .then(function() {
          response.success("Success");
        })
        .catch(function(error) {
          response.error({"message": error.message, "code": error.code});
        })
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
//       if (typeof userId != 'undefined')
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
