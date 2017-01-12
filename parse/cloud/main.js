var tango = require('cloud/tango.js');
var Stripe = require("stripe");
var http = require("http");
Stripe.initialize('sk_live_2s0ByDobi0ehymSdsA3vLXUt');

var twilioAccountSid = 'ACd31e27297ea5ceb19cee5eb70d17ae15';
var twilioAuthToken = '091db0e2f9df2fb1696caf3caee8368a';
var twilioPhoneNumber = '2675260237';
var secretPasswordToken = 'morning';
var language = "en";
var languages = ["en", "ja"];
var twilio = require('twilio')(twilioAccountSid, twilioAuthToken);

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!2");
});

Parse.Cloud.define("purchaseCardv2", function(request, response) {	
	var amountValue = parseInt(request.params.amount);
	var surchageValue = parseInt(request.params.surcharge);
	var stripeToken = request.params.token;
	
	var User = Parse.Object.extend("User");
		
		var purchasingUserId = request.params.purchasingUser;
	    var pUser = new User();
	    pUser.id = purchasingUserId;
		newValuePlusSurchase = amountValue + surchageValue;
		
		var z = 0;
		for (z in request.params.recipient) {	
			//get the user objectId for Parse backend
			var rUser = new User();
			rUser.id = request.params.recipient[z];
			
			//split the card amount for each user
			amountValue = request.params.amount / request.params.totalRecipients;
			//request the card amount from tango
			Parse.Cloud.httpRequest({
				    url: 'https://api.tangocard.com/raas/v1/orders',
				    path: '',
				    headers: {
						'Content-Type': 'application/json',
						'Authorization' : 'Basic UU1hc2h1cDpzVXdBMGZPalVUZHMyZkpNU0kyQk9MWHR1Um9kNVptUjdBTmNzY241ekNrR2JEVlhlSVlqOWVZelJ6RQ=='
			    	},
			    	method: 'POST',
				    body: {
					  "customer": "DefaultMMUser",
					  "account_identifier": "MorningMomentApp",
					  "campaign": "standardCampaign",
					  "recipient": {
					    "name": "Morning Moment User",
					    "email": "hi@morningmoment.com"
					  },
					  "sku": request.params.cardType,
					  "amount": 100*amountValue,
					  "reward_from": "Morning Moment User",
					  "reward_subject": "",
					  "reward_message": "",
					  "send_reward": false
				    }
				}).then(function(httpResponse) {
				    //response.success(httpResponse.text);
				    var obj = JSON.parse(httpResponse.text);
				    var CardClass = Parse.Object.extend("Cards");
					var listing = new CardClass();
					
					//setup the cardSKU in parse
					var GiftClass = Parse.Object.extend("Gifts");
					var cardSKUObject = new GiftClass();
					cardSKUObject.id =  request.params.cardObjectId; 
					
					listing.set("cardAmount", Math.floor(obj.order.amount));
					listing.set("cardSKU", cardSKUObject);
					listing.set("cardNumber", obj.order.reward.number);
					listing.set("cardUrl", obj.order.reward.redemption_url);
					listing.set("cardToken", obj.order.reward.token);
					listing.set("message", obj.order.reward_message);
					//listing.set("stripeId",stripeobj.id);
					//listing.set("stripeRefundUrl",stripeobj.refunds.url);
					//listing.set("stripeSourceId",stripeobj.source.id);
					//listing.set("stripeTotalCharged",Math.floor(stripeobj.amount));
					listing.set("purchasingUser", pUser);		
					listing.set("recipient", rUser);
					listing.set("cardProvider", "tango");
					listing.set("orderNumber", obj.order.order_id);
					listing.set("refunded",false);
					//listing.set("serviceDeliveryDate", obj.order.delivered_at);
					listing.save(response, {
					    success: function (listing) {   
						//check updated funding
						Parse.Cloud.run('tangoFundAccount',{
						  success: function(object) {
						  },
						  error: function(error) {
						  }
						});
							response.success(listing.id);
							z++;
					    },
					    error: function (error) {
					        response.error(error);
					        console.log("002 Error logged " + error);
					    }
					});
			}, 
			function (httpResponse, error) {
			    response.error('003 Request failed with response: ' + httpResponse.text)
			});
		}
	});

Parse.Cloud.define("purchaseCard", function(request, response) {	
	var amountValue = parseInt(request.params.amount);
	var surchageValue = parseInt(request.params.surcharge);
	var stripeToken = request.params.token;
	
	/*
			if (request.params.cardType == "CHIP-E-10-STD"){ //chiptole
			request.params.cardType = "CHIP-E-" + request.params.amount + "-STD";
			newValuePlusSurchase = amountValue + surchageValue;
			//amountValue = 0;
		} else { //non-chipotle
			amountValue = request.params.amount / request.params.totalRecipients;
			amountValue = 100*amountValue;
			newValuePlusSurchase = amountValue + surchageValue;
		}
		*/
	
	var User = Parse.Object.extend("User");
		
		var purchasingUserId = request.params.purchasingUser;
	    var pUser = new User();
	    pUser.id = purchasingUserId;
		
		newValuePlusSurchase = amountValue + surchageValue;
		
		Stripe.Charges.create({
			amount: 100*newValuePlusSurchase,
			currency: "usd",
			metadata: {"purchaserObjectId":purchasingUserId,"systemId":"Apple iOS"},
			card: stripeToken
			},{
			success: function(httpResponse) {
				var z = 0;
				for (z in request.params.recipient) {	
					//get the user objectId for Parse backend
					var rUser = new User();
					rUser.id = request.params.recipient[z];
					
					//split the card amount for each user
					amountValue = request.params.amount / request.params.totalRecipients;
					//request the card amount from tango
					var stripeobj = httpResponse;					
					Parse.Cloud.httpRequest({
						    url: 'https://api.tangocard.com/raas/v1/orders',
						    path: '',
						    headers: {
								'Content-Type': 'application/json',
								'Authorization' : 'Basic UU1hc2h1cDpzVXdBMGZPalVUZHMyZkpNU0kyQk9MWHR1Um9kNVptUjdBTmNzY241ekNrR2JEVlhlSVlqOWVZelJ6RQ=='
					    	},
					    	method: 'POST',
						    body: {
							  "customer": "DefaultMMUser",
							  "account_identifier": "MorningMomentApp",
							  "campaign": "standardCampaign",
							  "recipient": {
							    "name": "Morning Moment User",
							    "email": "hi@morningmoment.com"
							  },
							  "sku": request.params.cardType,
							  "amount": 100*amountValue,
							  "reward_from": "Morning Moment User",
							  "reward_subject": "",
							  "reward_message": "",
							  "send_reward": false
						    }
						}).then(function(httpResponse) {
						    //response.success(httpResponse.text);
						    var obj = JSON.parse(httpResponse.text);
						    var CardClass = Parse.Object.extend("Cards");
							var listing = new CardClass();
							
							//setup the cardSKU in parse
							var GiftClass = Parse.Object.extend("Gifts");
							var cardSKUObject = new GiftClass();
							cardSKUObject.id =  request.params.cardObjectId; 
							
							listing.set("cardAmount", Math.floor(obj.order.amount));
							listing.set("cardSKU", cardSKUObject);
							listing.set("cardNumber", obj.order.reward.number);
							listing.set("cardUrl", obj.order.reward.redemption_url);
							listing.set("cardToken", obj.order.reward.token);
							listing.set("message", obj.order.reward_message);
							listing.set("stripeId",stripeobj.id);
							listing.set("stripeRefundUrl",stripeobj.refunds.url);
							listing.set("stripeSourceId",stripeobj.source.id);
							listing.set("stripeTotalCharged",Math.floor(stripeobj.amount));
							listing.set("purchasingUser", pUser);		
							listing.set("recipient", rUser);
							listing.set("cardProvider", "tango");
							listing.set("orderNumber", obj.order.order_id);
							listing.set("refunded",false);
							//listing.set("serviceDeliveryDate", obj.order.delivered_at);
							listing.save(response, {
							    success: function (listing) {
								    
								//check updated funding
								Parse.Cloud.run('tangoFundAccount',{
								  success: function(object) {
								  },
								  error: function(error) {
								  }
								});
									response.success(listing.id);
									/*
								var LinksClass = Parse.Object.extend("Links");
								var query = new Parse.Query(LinksClass);
								query.get(request.params.latestLinkObject, {
								  success: function(updateLink) {
								    updateLink.save(null, {
									  success: function(updateLink) {
									    updateLink.set("card", listing);
									    updateLink.save();
									    response.success("001 Purchase complete. Card " + listing.id +". Sent to " + rUser.id +".");
									  }
									});
								  },
								  error: function(object, error) {
									   console.log("001 Error logged " + error);
								  }
								});
								*/
									
									z++;
							    },
							    error: function (error) {
							        response.error(error);
							        console.log("002 Error logged " + error);
							    }
							});
					}, 
					function (httpResponse, error) {
					    response.error('003 Request failed with response: ' + httpResponse.text)
					});
				}
		  	},
		  	error: function(httpResponse,error) {
		    	response.error("004-1 Uh oh, something went wrong: " + error);
		  	}
		});
	});
	
	Parse.Cloud.define("loadSite", function(request, response) {	
		Parse.Cloud.httpRequest({
	      url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'https%3A%2F%2Fstarbucks.semi.cashstar.com%2Fgift-card%2Fview%2FSPE7ZxX17AZ8U1C55r6RJ5hFS%2F'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
	      success: function(httpResponse) {
	        response.success(httpResponse.text);
	      },
	      error: function(httpResponse) {
	        response.error('Request failed with response code ' + httpResponse.status)
	      }
	    });
});

Parse.Cloud.define("sendSMSCode", function(request, response) {
	Parse.Cloud.useMasterKey();
	var code = Math.floor(Math.random()*90000) + 10000;
	var phoneNumber = request.params.phoneNumber;
	var prefix = "+1";
	var promise = new Parse.Promise();
	
	//Save code to user profile
	var User = Parse.Object.extend("User");
	var userObjectId = request.params.userObjectId;
    var updateUser = new User();
    updateUser.id = userObjectId;
    updateUser.set("SMSCode", code);
    updateUser.set("phoneNumber", phoneNumber);
	updateUser.save();
    
	twilio.sendSms({
		to: prefix + phoneNumber.replace(/\D/g, ''),
		from: twilioPhoneNumber.replace(/\D/g, ''),
		body: 'Your login code for Morning Moment is ' + code
	}, function(err, responseData) {
		if (err) {
			console.log(err);
			promise.reject(err.message);
			response.error(err.message);
		} else {
			response.success("SMS Sent to " + userObjectId);
			promise.resolve();
		}
	});
	return promise;
});

Parse.Cloud.afterSave(Parse.User, function(request) {
	Parse.Cloud.useMasterKey();
	if (!request.object.existed()) {
		//Welcome Message Link
		var links = Parse.Object.extend("Links");
		var linkObject = new links();
		
		var morningMomentTeamAccount = new Parse.User();
		morningMomentTeamAccount.id = "9cLbaWUsoG";
		linkObject.set("from", morningMomentTeamAccount);
		linkObject.set("to", request.object);
		
		var moments = Parse.Object.extend("Moments");
		var welcomeMomentMessage = new moments();
		welcomeMomentMessage.id = "nTjVysBPfB";
		linkObject.set("moment", welcomeMomentMessage);
		
		linkObject.set("overrideCreateDate", true);
		linkObject.save();
		
		//Follow Morning Moment Team Account
		var followers = Parse.Object.extend("Followers");
		var followerObject = new followers();
		followerObject.set("from", request.object);
		followerObject.set("to", morningMomentTeamAccount);
		followerObject.save();
		
		var followerObject2 = new followers();
		followerObject2.set("to", request.object);
		followerObject2.set("from", morningMomentTeamAccount);
		followerObject2.save();
		
		var followerObject3 = new followers();
		followerObject3.set("from", request.object);
		followerObject3.set("to", request.object);
		followerObject3.save();
		
		//Create own invite code
		request.object.set("myInviteCode",request.object.id.toUpperCase().substr(0,5));
		request.object.save();
		
		//Check for invite code
		var query = new Parse.Query(Parse.User);
		query.equalTo("myInviteCode", request.object.get("iCode"));
		query.first({
		  success: function(object) {
			console.log("Saved invite code..." +object.get("username"));
			//object.set("iCode", "testing");
			object.increment("inviteCodeUsed");
			object.save();
		    // Successfully retrieved the object.
		  },
		  error: function(error) {
		    alert("Error: " + error.code + " " + error.message);
		  }
		});

	}
});

Parse.Cloud.beforeSave("Followers", function(request,response) {
  Parse.Cloud.useMasterKey();
    
  //see if user was added  
    var query = new Parse.Query("Followers");
	query.equalTo("from", request.object.get("from"));
	query.equalTo("to", request.object.get("to"));
    query.find({
	    success: function(results) {
			if (results.length > 0){
		  		response.error("Duplicate record, already added.");	    	
			} else {
				response.success();	    	
			}
	    },
	    error: function(error) {
	      console.error("USER: Got an error " + error.code + " : " + error.message);
	    }
    });
  
});

Parse.Cloud.afterSave("Links", function(request,response) {
  	Parse.Cloud.useMasterKey();
  	if (!request.object.existed()) {
		var query = new Parse.Query(Parse.User);
		var fromUsername;
		query.get(request.object.get("from").id, {
		  success: function(post) {
		    //send a push notification to the user
		    fromUsername = post.get("username");
		    var query = new Parse.Query(Parse.Installation);
			query.equalTo('user', request.object.get("to"));
			Parse.Push.send({
			  where: query,
			  data: {
			    alert: post.get("username") + " sent a moment"
			  }
			}, {
			  success: function() {
			    console.error("user push successful");
			  },
			  error: function(error) {
			    console.error("PUSH: Got an error " + error.code + " : " + error.message);
			  }
			});
		},
		error: function(error) {
		  console.error("FROMUSER: Got an error " + error.code + " : " + error.message);
		}
		});
	}
    
}); 

Parse.Cloud.afterSave("Followers", function(request,response) {
  Parse.Cloud.useMasterKey();
    
  //send notification to user
  /*
    var toUser = request.object.get("to");
    var fromUser = request.object.get("from");
	
	var query = new Parse.Query(Parse.Installation);
	query.equalTo('user', toUser);
	
  	  Parse.Push.send({
	  where: query,
	  data: {
	    alert: fromUser.get("username") + " started following you"
	  }
	}, {
	  success: function() {
	    console.error("user push successful: " + fromUser.get("username"));
	  },
	  error: function(error) {
	    console.error("PUSH: Got an error " + error.code + " : " + error.message);
	  }
	});
	*/
	
	//send push notification on behalf of the "from" user
	
    var query = new Parse.Query(Parse.User);
    var fromUsername;
	query.get(request.object.get("from").id, {
      success: function(post) {
	    //send a push notification to the user
	    fromUsername = post.get("username");
	    var query = new Parse.Query(Parse.Installation);
		query.equalTo('user', request.object.get("to"));
		Parse.Push.send({
		  where: query,
		  data: {
		    alert: post.get("username") + " started following you"
		  }
		}, {
		  success: function() {
		    console.error("user push successful");
		  },
		  error: function(error) {
		    console.error("PUSH: Got an error " + error.code + " : " + error.message);
		  }
		});
    },
    error: function(error) {
      console.error("FROMUSER: Got an error " + error.code + " : " + error.message);
    }
    });
  
});


Parse.Cloud.afterSave("SubscribeTo", function(request,response) {
    Parse.Cloud.useMasterKey();
    
    //get Subscription
    /*
	var Subscriptions = Parse.Object.extend("Subscriptions");
	var subObject = new Subscriptions();
	subObject.id = request.object.get("to").id;
	*/
	
	var query = new Parse.Query("Subscriptions");
	query.get(request.object.get("to").id, {
      success: function(post) {         
		//Welcome Message Link
		var links = Parse.Object.extend("Links");
		var linkObject = new links();
		
		var subUserAccount = new Parse.User();
		subUserAccount.id = post.get("user").id;
		linkObject.set("from", subUserAccount);
		linkObject.set("to", request.object.get("from"));
		
		var moments = Parse.Object.extend("Moments");
		var welcomeMomentMessage = new moments();
		welcomeMomentMessage.id = post.get("welcomeMoment").id;
		linkObject.set("moment", welcomeMomentMessage);
		linkObject.set("overrideCreateDate", true);
		linkObject.save();
    },
    error: function(error) {
      console.error("Got an error " + error.code + " : " + error.message);
    }
    });
  
});


Parse.Cloud.afterSave("Music", function(request,response) {
  	Parse.Cloud.useMasterKey();
  	if (!request.object.existed()) {
		Parse.Cloud.httpRequest({
		    url: 'https://itunes.apple.com/lookup?id='+request.object.get("trackID"),
		    path: '',
		    headers: {
				'Content-Type': 'application/json',
	    	},
	    	method: 'POST',
		    body: {
		    }
		}).then(function(httpResponse) {
			var obj = JSON.parse(httpResponse.text);
			//console.log("Save ko"+JSON.stringify(obj.results[0].artistName));
			var artist = JSON.stringify(obj.results[0].artistName);
			artist = artist.substring(1,((artist.length)-1));
			var track = JSON.stringify(obj.results[0].trackName);
			track = track.substring(1,((track.length)-1));
			var photo = JSON.stringify(obj.results[0].artworkUrl100);
			photo = photo.substring(1,((photo.length)-1));
			var trackUrl = JSON.stringify(obj.results[0].previewUrl);
			trackUrl = trackUrl.substring(1,((trackUrl.length)-1));
			
			request.object.set("artist", artist);
			request.object.set("trackName", track);
			request.object.set("photo", photo);
			request.object.set("trackUrl", trackUrl);
			request.object.set("active", true);
			request.object.save(response, {
			    success: function (listing) {
			        response.success("done");
			        console.log("Save ok");
			    },
			    error: function (error) {
			        response.error(error);
			        console.log("Did not save");
			    }
			});
		
		}, 
		function (httpResponse, error) {
		    response.error('Request failed with response: ' + httpResponse.text)
		});
	}
    
});




/*	
function getGiftCard(purchaseRequest,stripeCharge){
	Parse.Cloud.httpRequest({
	    url: 'https://sandbox.tangocard.com/raas/v1/orders',
	    path: '',
	    headers: {
			'Content-Type': 'application/json',
			'Authorization' : 'Basic UU1hc2h1cFRlc3Q6cFpselFFVHd1S1lCSFFHOFdHVkxxZkdGQjhkWWJZTUZLWGQzN1k4NmZ5clZwWjdOMHMyYkVuRVBGOA=='
    	},
    	method: 'POST',
	    body: {
		  "customer": "testAccount",
		  "account_identifier": "QMashupTest",
		  "campaign": "standardCampaign",
		  "recipient": {
		    "name": "Davey",
		    "email": "davey@testemail.com"
		  },
		  "sku": "SBUX-E-V-STD",
		  "amount": 1000,
		  "reward_from": "testSender",
		  "reward_subject": "testSubject",
		  "reward_message": "This is a test message!!!",
		  "send_reward": false
	    }
	}).then(function(httpResponse) {
	    //response.success(httpResponse.text);
	    var obj = JSON.parse(httpResponse.text);
	    var CardClass = Parse.Object.extend("Cards");
		var listing = new CardClass();
		listing.set("amount", Math.floor(obj.order.amount));
		listing.set("cardSKU", obj.order.sku);
		listing.set("cardNumber", obj.order.reward.number);
		listing.set("cardUrl", obj.order.reward.redemption_url);
		listing.set("cardToken", obj.order.reward.token);
		listing.set("message", obj.order.reward_message);
		//listing.set("purchasingUser", "");		
		//listing.set("recipient", "");
		listing.set("service", "tango");
		listing.set("serviceOrderID", obj.order.order_id);
		//listing.set("serviceDeliveryDate", obj.order.delivered_at);
		listing.save(response, {
		    success: function (listing) {
		        response.success("done");
		        console.log("Save ok");
		    },
		    error: function (error) {
		        response.error(error);
		        console.log("Save ko");
		    }
		});
	}, 
	function (httpResponse, error) {
	    //console.error('Request failed with response: ' + httpResponse.text);
	    response.error('Request failed with response: ' + httpResponse.text)
	});
}
*/