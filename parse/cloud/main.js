var twilioAccountSid = 'ACd31e27297ea5ceb19cee5eb70d17ae15';
var twilioAuthToken = '091db0e2f9df2fb1696caf3caee8368a';
var twilioPhoneNumber = '2675260237';
var secretPasswordToken = 'morning';
var language = "en";
var languages = ["en", "ja"];
//var twilio = require('twilio')(twilioAccountSid, twilioAuthToken);
var twilioAccountSid = 'ACd31e27297ea5ceb19cee5eb70d17ae15';
var twilioAuthToken = '091db0e2f9df2fb1696caf3caee8368a';
var twilioPhoneNumber = '2675260237';
var secretPasswordToken = 'morning';
var language = "en";
var languages = ["en", "ja"];

Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
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
