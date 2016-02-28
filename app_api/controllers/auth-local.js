var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require('jsonwebtoken');

var Utils = require('../utils/util.js');
var utils = new Utils();

module.exports.register = function(req, res) {
  console.log('called register server side');
  if(!req.body.name || !req.body.email || !req.body.password) {
    utils.sendJSONresponse(res, 400, "All fields required");
    return;
  }

  User.findOne({ 'local.email': req.body.email }, function (err, user) {
    if (err || user) { 
      utils.sendJSONresponse(res, 400, "User already exists. Try to login.");
      return;
    }

    var user = new User();
    user.local.name = req.body.name;
    user.local.email = req.body.email;
    user.setPassword(req.body.password);

    user.save(function(err, savedUser) {
      var token;
      if (err) {
        utils.sendJSONresponse(res, 404, err);
      } else {
        console.log("USER: "); 
        console.log(savedUser);
        token = savedUser.generateJwt(savedUser);

        // var myCookie = JSON.stringify(user);
        req.session.localUserId = savedUser._id;

        // res.cookie('localCookie', myCookie /*, { maxAge: 900000, httpOnly: true }*/);
        res.status(200);

        // res.contentType('application/json');
        res.json({ token : token });

        // utils.sendJSONresponse(res, 200, 
        //   JSON.stringify({ 
        //     'token' : token,
        //     'id' : savedUser._id
        //   })
        //   );
      }
    });
  });

  
};

module.exports.login = function(req, res) {
  if(!req.body.email || !req.body.password) {
    utils.sendJSONresponse(res, 400, {
      "message": "All fields required"
    });
    return;
  }
  
  passport.authenticate('local', function(err, user, info){
    var token;
    if (err) {
      utils.sendJSONresponse(res, 404, err);
      return;
    }
    if(user){

      console.log("USER: "); 
      console.log(user);
      token = user.generateJwt(user);

      req.session.localUserId = user._id;

      res.status(200);
      res.json({ token: token });

    } else {
      utils.sendJSONresponse(res, 401, info);
    }
  })(req, res);
};

module.exports.unlinkLocal = function(req, res) {
  console.log("User found to unlink: ");
  if (req.params && req.params.id) {
    var id = req.params.id;
    console.log("data received id: " + id);
    User.findOne({ '_id': id }, function (err, user) {
      user.local = undefined;
      user.save(function(err) {
        var cookie = regenerateJwtCookie(user);
        res.cookie('userCookie', cookie /*, { maxAge: 900000, httpOnly: true }*/);  
        utils.sendJSONresponse(res, 200, user);
      });
    });
  }
};

function regenerateJwtCookie(user) {
  var token3dauth = user.generateJwt(user);
  var myCookie = JSON.stringify({ 
    'value': user._id,
    'token': token3dauth
  });
  return myCookie;
};

module.exports.decodeToken = function(req, res) {
  console.log('decodetoken', req.params);
  if (req.params && req.params.token) {

    var token = req.params.token;
    console.log("data received jwt: " + token);

        // verify a token symmetric
        jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
          if(err) {
            console.log("ERROR");
            utils.sendJSONresponse(res, 404, null);
          } 

          if(decoded) {
            console.log("decoding...");
            console.log(decoded);
            var convertedDate = new Date();
            convertedDate.setTime(decoded.exp);
            
            console.log("date jwt: " + convertedDate.getTime() +
              ", formatted: " + utils.getTextFormattedDate(convertedDate));
            
            var systemDate = new Date();
            console.log("systemDate: " + systemDate.getTime() + 
              ", formatted: " + utils.getTextFormattedDate(systemDate));

            if( convertedDate.getTime() > systemDate.getTime() ) {
              console.log("systemDate valid");
              console.log("stringifying...");
              console.log(JSON.stringify(decoded));
              utils.sendJSONresponse(res, 200, JSON.stringify(decoded));
            } else {
              console.log('No data valid');
              utils.sendJSONresponse(res, 404, "invalid-data");
            }
          }
        });

      } else {
        console.log('No token found');
        utils.sendJSONresponse(res, 404, null);
      }
    };