
// Push Notifications
require('./push_notifications');

// Transactions
require('./transactions');

// Testing
require('./testing');

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});
