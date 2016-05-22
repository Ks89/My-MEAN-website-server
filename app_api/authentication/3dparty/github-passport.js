module.exports = function (userRef, passportRef) {
  var GitHubStrategy = require('passport-github2').Strategy;
  var thirdpartyConfig = require('./3dpartyconfig');
  var logger = require('../../utils/logger.js');

  //----------experimental---
  var authExperimentalFeatures = require('../../controllers/auth-experimental-collapse-db.js');
  //-------------------------

  function updateUser (user, accessToken, profile) {
    user.github.id = profile.id;
    user.github.token = accessToken;
    user.github.name  = profile.displayName;
    user.github.email = profile.emails[0].value; //get the first email
    user.github.username = profile.username;
    user.github.profileUrl = profile.profileUrl;
    return user;
  }

  passportRef.use(new GitHubStrategy( thirdpartyConfig.github,
  function(req, accessToken, refreshToken, profile, done) {
   
    logger.debug('Github authentication called');

    process.nextTick(function () {
      //check if the user is already logged in using the local authentication
      var sessionLocalUserId = req.session.localUserId;
      if(sessionLocalUserId) {
        //the user is already logged in
        userRef.findOne({ '_id': sessionLocalUserId }, function (err, user) {
          if (err) { throw err; }
          var userUpdated = updateUser(user, accessToken, profile);
          console.log("updated localuser with 3dpartyauth");
          userUpdated.save(function(err) {
            if (err) { throw err; }
            return done(null, userUpdated);
          });
        });
      } else {
      	if (!req.user) { //check if the user is already logged in    
        // find the user in the database based on their id
	        userRef.findOne({ 'github.id' : profile.id }, function(err, user) {
	          	console.log("User.findOne...");
	          	if (err) { return done(err); }

	          	if (user) { // if the user is found, then log them in
		            console.log("User found");
		            // if there is a user id already but no token (user was linked at one point and then removed)
		            // just add our token and profile information
                var userUpdated = '';
		            if (!user.github.token) {
		              userUpdated = updateUser(user, accessToken, profile);
		              userUpdated.save(function(err) {
		                if (err) { throw err; }
		                return done(null, userUpdated);
		              });
		            }
		            return done(null, user); // user found, return that user
	          	} else { //otherwise, if there is no user found with that github id, create them
		            var newUser = updateUser(new userRef(), accessToken, profile);
		            console.log("New user created: " + newUser);
		            newUser.save(function(err) {
		              if (err) { throw err; }
		              return done(null, newUser);
		            });
	          	}
	        });
      	} else { // user already exists and is logged in, we have to link accounts    
          	// req.user pull the user out of the session
          	// and finally update the user with the current users credentials
          	var user = updateUser(req.user, accessToken, profile);
          	user.save(function(err) {
            	if (err) { throw err; }

              //----------------- experimental ---------------
              authExperimentalFeatures.collapseDb(user, "github");
              //----------------------------------------------

            	return done(null, user);
          	});
        }
      }
    }); //end of process.nextTick
  } //end of function(...)
  ));//end of passport.use

  return module;
};