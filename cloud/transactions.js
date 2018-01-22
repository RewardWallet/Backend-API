

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
// 	"businessId": "GEkx6rz7rD"
// }
// Returns a Transaction objects id
Parse.Cloud.define("openTransaction", function(request, response) {

  const amount = request.params.amount;
  const businessId = request.params.businessId;

  // 1. Check for undefined parameters
  if (typeof amount == 'undefined')
    return response.error({"message":"Undefined Transaction Amount"});

  if (typeof businessId == 'undefined')
    return response.error({"message":"Undefined Business"});

  // 2. Get the business object to assign as a pointer
  const query = new Parse.Query(Parse.Object.extend("Business"));
  query.get(businessId)
    .then(function(business) {

      // 3. Create a new Transaction object and assign the amount and business owner
      var transaction = new Transaction();
      transaction.set("amount", amount)
      transaction.set("business", business)
      transaction.set("isFake", business.get("isFake") || false);

      // 4. Only the business has read access to the transaction
      var acl = new Parse.ACL();
      acl.setReadAccess(businessId, true); // Only the business can read
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
// 	"transactionId": 27hHA8ia2,
// 	"userId": "GEkx6rz7rD""
// }
Parse.Cloud.define("closeTransaction", function(request, response) {

  const transactionId = request.params.transactionId;
  const userId = request.params.userId;

  // 1. Check for undefined parameters
  if (typeof transactionId == 'undefined')
    return response.error({"message":"Undefined Transaction ID"});

  if (typeof userId == 'undefined')
    return response.error({"message":"Undefined User"});

  // 2. Get the user object to assign as a pointer
  const query = new Parse.Query(Parse.User);
  query.get(userId)
    .then(function(user) {

      // 3. Create a query for the transaction, MasterKey required due to ACL
      const query = new Parse.Query(Transaction);
      query.get(transactionId, { useMasterKey: true })
        .then(function(transaction) {

          // 4. Transactions cannot be overritten once closed
          if (typeof transaction.get("user") != 'undefined')
            return response.error({"message":"Requested transaction is already closed"});

          // 5. Assign a user pointer to the transaction
          transaction.set("user", user);

          // 6. Save the transaction, again using the MasterKey due to ACL
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
