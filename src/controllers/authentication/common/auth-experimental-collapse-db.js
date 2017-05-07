'use strict';

const _ = require('lodash');
let Utils = require('../../../utils/util.js');
let logger = require('../../../utils/logger-winston.js');
let User = require('mongoose').model('User');
let authCommon = require('./auth-common.js');
let serviceNames = require('../serviceNames');

module.exports.collapseDb = (loggedUser, serviceName, req) => {
	return new Promise((resolve, reject) => {
		if(Utils.isNotSimpleCustomObject(loggedUser)) {
			logger.error('auth-experimental-collapse-db collapse-db - impossible to collapseDb because loggedUser is not an object');
			reject('impossible to collapseDb because loggedUser is not an object');
			return;
		}

		if(!_.isString(serviceName)) {
			logger.error('auth-experimental-collapse-db collapse-db - impossible to collapseDb because serviceName must be a string');
			reject('impossible to collapseDb because serviceName must be a string');
			return;
		}

		if(serviceNames.indexOf(serviceName) === -1) {
			logger.error('auth-experimental-collapse-db collapse-db - impossible to collapseDb because serviceName is not recognized');
			reject('impossible to collapseDb because serviceName is not recognized');
			return;
		}

		logger.debug(`auth-experimental-collapse-db collapse-db - starting to collapse with serviceName=${serviceName}`, loggedUser);

		let inputId;
		let query = {};
		const keyProperty = serviceName === 'local' ? 'email' : 'id';

		if(loggedUser[serviceName] && !_.isNil(loggedUser[serviceName][keyProperty])) {
			inputId = loggedUser[serviceName][keyProperty];
			const key =  serviceName + '.' + keyProperty;
			query[key] = inputId;
		}

    logger.debug(`auth-experimental-collapse-db collapse-db - query built`, query);

    if(_.isNil(inputId)) {
      logger.error('auth-experimental-collapse-db collapse-db - inputId is not valid (null OR undefined)');
			reject('input id not valid while collapsing');
		}

		User.find(query, (err, users) => {
			if(!users || err) {
        logger.error(`auth-experimental-collapse-db collapse-db - db error cannot find user`, err);
				reject('User  not found while collapsing');
			}

      logger.debug(`auth-experimental-collapse-db collapse-db - users found`, users);

			//retrive the logged user from the db using his _id (id of mongodb's object)
			let user = users.find(el => {
				if(el && el._id) {
					return el._id + '' === loggedUser._id + '';
				}
			});

			if(!user) {
				logger.error('auth-experimental-collapse-db collapse-db - user not found');
				reject('User not found while collapsing db');
				return;
			}

			let duplicatedUser = users.filter(dbUser => {
				let idOrEmail = dbUser[serviceName][keyProperty];
				if (dbUser && dbUser[serviceName] && idOrEmail === inputId &&
					 (dbUser._id + '') !== (user._id + '') ) {
					return dbUser;
				}
			});

			if(!duplicatedUser || !duplicatedUser[0]) {
        logger.debug('auth-experimental-collapse-db collapse-db - No duplicated user found');
				reject('No duplicated user found while collapsing');
				return;
			}

			duplicatedUser = duplicatedUser[0];

      logger.debug('auth-experimental-collapse-db collapse-db - preparing to collapse duplicated db users', user, duplicatedUser);

			let updated = false;

			//ATTENTION: at the moment I decided to manage profile info as services.
			//TODO modify this creating a better logic instead of using profile as a service
			serviceNames.forEach(s => {
        // console.log('cycle s: ' + s + ', serviceName: ' + serviceName);
        if(s !== serviceName && (!user[s] || !user[s].id) &&
          duplicatedUser[s] && (duplicatedUser[s].id || duplicatedUser[s].email)) {
          user[s] = duplicatedUser[s];
          updated = true;
        }
			});

      logger.debug('auth-experimental-collapse-db collapse-db - modified user', user);

      if(!duplicatedUser || !updated) {
        logger.debug(`auth-experimental-collapse-db collapse-db - I can't do anything because there isn't a duplicated users!`);
        reject(`I can't do anything because there isn't a duplicated users! [OK]`);
			}

			user.save((err2, savedUser) => {
				if (!savedUser || err2) {
					logger.error('auth-experimental-collapse-db collapse-db - error while saving collapsed users', err2);
					reject('Error while saving collapsed users');
				}

				logger.debug('auth-experimental-collapse-db collapse-db - user saved', savedUser);
				logger.debug('auth-experimental-collapse-db collapse-db - updating auth token with user info');

				try {
					req.session.authToken = authCommon.generateSessionJwtToken(savedUser);
				} catch(err3) {
					logger.error('auth-experimental-collapse-db collapse-db - error while calling generateSessionJwtToken', err3);
					reject('Impossible to generateSessionJwtToken due to an internal server error');
					return;
				}

				logger.debug('auth-experimental-collapse-db collapse-db - req.session.authToken collapse finished', req.session.authToken);
				logger.debug('auth-experimental-collapse-db collapse-db - user saved', savedUser);

				logger.debug('auth-experimental-collapse-db collapse-db - removing duplicated user');

				User.findByIdAndRemove(duplicatedUser._id, err => {
					if (err) {
						logger.error('auth-experimental-collapse-db collapse-db - impossible to find and remove duplicated user', err);
						reject('Impossible to remove duplicated user while collapsing');
					}
					// we have deleted the user
					logger.debug('auth-experimental-collapse-db collapse-db - duplicated User deleted', savedUser);
					resolve(savedUser);
				});
			});
		});
	});
};
