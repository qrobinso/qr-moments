//Sandbox
//var tangoUrl = "https://sandbox.tangocard.com/";
//var authHeader = "Basic UU1hc2h1cFRlc3Q6cFpselFFVHd1S1lCSFFHOFdHVkxxZkdGQjhkWWJZTUZLWGQzN1k4NmZ5clZwWjdOMHMyYkVuRVBGOA==";
//var curentCreditCardToken = "34407621"; //TESTACCOUNT 4111111111111111

//Production
var tangoUrl = "https://api.tangocard.com/";
var authHeader = "Basic UU1hc2h1cDpzVXdBMGZPalVUZHMyZkpNU0kyQk9MWHR1Um9kNVptUjdBTmNzY241ekNrR2JEVlhlSVlqOWVZelJ6RQ==";


var customerName = "DefaultMMUser";
var customerId = "MorningMomentApp";
var customerEmail = "hi@morningmoment.com";
var curentCreditCardToken = "186316118"; //TESTACCOUNT 4111111111111111
var ccSecurityCode = "330"; //TESTACCOUNT 4111111111111111
//var fundAmount = 10000; //$100
//var fundAmount = 5000; //$50
var fundAmount = 1000; //$10

Parse.Cloud.define("getCurrentFundingValue", function(request, response) {
	var config = Parse.Config();
	response.success("FUND VALUE: " + config.get(tangoFundValue));
});

Parse.Cloud.define("tangoCreateAccount", function(request, response) {
	  					Parse.Cloud.httpRequest({
						    url: tangoUrl + 'raas/v1.1/accounts',
						    path: '',
						    headers: {
								'Content-Type': 'application/json',
								'Authorization' : authHeader 
					    	},
					    	method: 'POST',
						    body: {
								"customer":customerName,
								"identifier":customerId,
								"email":customerEmail
						    }
						}).then(function(httpResponse) {
						    var result = JSON.parse(httpResponse.text);
						    response.success(result);
					}, 
					function (httpResponse, error) {
					    response.error('003 Request failed with response: ' + httpResponse.text)
					});
});

Parse.Cloud.define("tangoCreditCardRegister", function(request, response) {
	  					Parse.Cloud.httpRequest({
						    url: tangoUrl + 'raas/v1.1/cc_register',
						    path: '',
						    headers: {
								'Content-Type': 'application/json',
								'Authorization' : authHeader
					    	},
					    	method: 'POST',
						    body: {
								"customer": customerName,
								"account_identifier": customerId,
								"client_ip": "73.160.253.13",
								  "credit_card": {
								    "number": "xxxxxx0294",
								    "security_code": "xxx",
								    "expiration": "xxxx-xxx",
								    "billing_address": {
								      "f_name": "xxxx",
								      "l_name": "xxxx",
								      "address": "xxxx",
								      "city": "xxxx",
								      "state": "xxxx",
								      "zip": "xxxx",
								      "country": "xxxx",
								      "email": "xxxx"
								    }
								}
						    }
						}).then(function(httpResponse) {
						    var result = JSON.parse(httpResponse.text);
						    response.success(result);
					}, 
					function (httpResponse, error) {
					    response.error('003 Request failed with response: ' + httpResponse.text)
					});
});

Parse.Cloud.define("tangoFundAccount", function(request, response) {
	  					Parse.Cloud.httpRequest({
						    url: tangoUrl + 'raas/v1.1/cc_fund',
						    path: '',
						    headers: {
								'Content-Type': 'application/json',
								'Authorization' : authHeader
					    	},
					    	method: 'POST',
						    body: {
								"customer": customerName,
								"account_identifier": customerId,
								"amount": fundAmount,
								"client_ip": "127.0.0.1",
								"cc_token": curentCreditCardToken,
								"security_code": ccSecurityCode
						    }
						}).then(function(httpResponse) {
						    var result = JSON.parse(httpResponse.text);
						    response.success(result);
					}, 
					function (httpResponse, error) {
					    response.error('003 Request failed with response: ' + httpResponse.text)
					});
});

Parse.Cloud.define("tangoGetAccountBalance", function(request, response) {
						var result=new Array();
						var status;
	  					Parse.Cloud.httpRequest({
						    url: tangoUrl + 'raas/v1.1/accounts/'+customerName+'/'+customerId,
						    path: '',
						    headers: {
								'Content-Type': 'application/json',
								'Authorization' : authHeader
					    	},
					    	method: 'GET',
						    body: {
						    }
						}).then(function(httpResponse) {
						    result = JSON.parse(httpResponse.text);
						    var currentBalance = result["account"]["available_balance"];
						    if (currentBalance < 3000) {
							    status = "Funding Required (" + currentBalance + ")";
							    
							    Parse.Cloud.run('tangoFundAccount',{
								  success: function(object) {
								  },
								  error: function(error) {
								  }
								});
								
						    } else {
							    status = "Enough Funding  (" + currentBalance + ")";
						    }
							
						    response.success(status);
						    //response.success(result["account"]);
					}, 
					function (httpResponse, error) {
					    response.error('003 Request failed with response: ' + httpResponse.text)
					});
});