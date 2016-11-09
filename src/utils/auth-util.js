var _ = require('lodash');
var jwt = require('jsonwebtoken');
var Utils = require('./util');
var whitelistServices = require('../controllers/authentication/serviceNames');

class AuthUtils {

  constructor(){}

  static checkIfLastUnlink(serviceName, user) {
    if(!user) {
      throw 'User must be a valid object';
    }

    if(!_.isString(serviceName)) {
      throw 'Service name must be a String';
    }

    if(whitelistServices.indexOf(serviceName) === -1) {
      return false;
    }

    let result = false;
    let checkProp;
    //I remove serviceName from whitelistServices
    const noProfileServices = _.without(whitelistServices, 'profile');
    const filteredServices = _.without(noProfileServices, serviceName);

    for(let service of filteredServices) {
      checkProp = service === 'local' ? 'email' : 'id';

      //something like !user.facebook.id or !user.local.email and so on
      result = !user[service][checkProp];

      if(!result) {
        break;
      }
    }

    return result;
  }

  static removeServiceFromUserDb(serviceName, user) {
    if(!user || _.isString(user) ||
        !_.isObject(user) || _.isArray(user) || _.isBoolean(user) ||
        _.isDate(user) || Utils.isNotAcceptableValue(user)) {
      throw 'User must be a valid object';
    }

    if(!_.isString(serviceName)) {
      throw 'Service name must be a String';
    }

    if(whitelistServices.indexOf(serviceName) === -1) {
      throw 'Service name not valid';
    }

    user[serviceName] = undefined;
    return user;
  }
}

module.exports = AuthUtils;
