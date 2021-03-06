'use strict';

const _ = require('lodash');
let jwt = require('jsonwebtoken');
let logger = require('./logger-winston');
const config = require('../config');

class Utils {

  constructor(){}

  static sendJSONres(res, status, content) {
    let contentToReturn;

    //check status param
    if(_isNotValidNumber(status) || status < 100 || status >= 600) {
      throw 'Status must be a valid http status code  number';
    }

    //check content param
    //because content can be only String, Array, Object (but no all of the others)
    if(_isNotStringArrayObject(content) ||
      _isNotAcceptableValue(content) || _.isDate(content) || _.isBoolean(content) ||
      _.isNumber(content)) {
      throw 'Content must be either String, or Array, or Object (no Error, RegExp, and so on )';
    }

    res.status(status);
    res.contentType('application/json');

    if(status >= 400 && status < 600) {
      if(_.isString(content) || _.isArray(content)) {
        contentToReturn = {
          message : content
        };
      } else {
        contentToReturn = content;
      }
    } else {
      contentToReturn = content;
    }
    res.json(contentToReturn);
  }

  static getTextFormattedDate(date) {
    logger.debug('getTextFormattedDate ' + date);
    if(!_.isDate(date)) {
      throw 'Not a valid date';
    }
    const day = date.getDay();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();

    return day + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec;
  }

    //Function that returns true if the param
  // is not a custom Object (neither an array, or an error, or a function, or null, or
  // undefined, or a boolean, or nan)
  // false otherwise
  //isObject: JavaScript arrays and functions
  //          are objects, while (normal) strings and numbers are not.
  static isNotSimpleCustomObject(obj) {
    return !_.isObject(obj) || _.isArray(obj) ||
        _isNotAcceptableValue(obj) || _.isBoolean(obj);
  }

  static isNotSimpleCustomObjectOrDate(obj) {
    return this.isNotSimpleCustomObject(obj) || _.isDate(obj);
  }

  static isJwtValidDate(decodedJwtToken) {
    // console.log('isJwtValidDate');
    // console.log(decodedJwtToken);

    //isObject: JavaScript arrays and functions
    //          are objects, while (normal) strings and numbers are not.
    if(!decodedJwtToken ||
        !_.isObject(decodedJwtToken) || _.isArray(decodedJwtToken) ||
        _isNotAcceptableValue(decodedJwtToken) || _.isBoolean(decodedJwtToken)) {
      throw 'Not a valid decodedJwtToken';
    }

    if(!decodedJwtToken.hasOwnProperty('exp')) {
      throw 'Expire date not found';
    }

    //decodedJwtToken.exp is a Float that represents the exp date
    //it must be a float, and not a Date
    //NB: parseFloat returns NaN if it can't parse a value
    if(_.isDate(decodedJwtToken.exp) || _.isNaN(parseFloat(decodedJwtToken.exp))) {
      throw 'Not a float expiration date';
    }

    let convertedDate = new Date();
    convertedDate.setTime(decodedJwtToken.exp);
    // console.log('date jwt: ' + convertedDate.getTime() +
    //  ', formatted: ' + this.getTextFormattedDate(convertedDate));
    // const systemDate = new Date();
    // console.log('systemDate: ' + systemDate.getTime() +
    //   ', formatted: ' + this.getTextFormattedDate(systemDate));
    // convertedDate > systemDate
    return convertedDate.getTime() > (new Date()).getTime();
  }

  static isJwtValid(token) {
    let self = this;

    if(!token || !_.isString(token) ||
        _.isObject(token) || _.isArray(token) ||
        _isNotAcceptableValue(token)) {
      throw 'Not a valid token';
    }

    return new Promise((resolve, reject) => {
      // verify a token symmetric
      jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if(err) {
          logger.error('util isJwtValid - jwt.verify error', err);
          reject({status: 401, message: 'Jwt not valid or corrupted'});
        }

        if(!decoded) {
          logger.error('util isJwtValid - Impossible to decode token');
          reject({status: 401, message: 'Impossible to decode token.'});
        }

        try {
          if(!self.isJwtValidDate(decoded)) {
            logger.error('util isJwtValid - Token Session expired (date)');
            reject({status: 401, message: 'Token Session expired (date).'});
          }

          logger.debug('util isJwtValid - Jwt is valid', decoded);
          resolve(decoded);
        } catch(err2) {
          logger.error('util isJwtValid - isJwtValidDate thrown an error', err2);
          reject({status: 500, message: 'Impossible to check if jwt is valid'});
        }
      });
    });
  }

  // This method returns true if the parameter is NOT acceptable, i.e.
  // is a function OR
  // is _isNotValidJavascriptObject OR
  // is null OR
  // is undefined OR
  // is NaN;
  // false otherwise.
  static isNotAcceptableValue(param) {
    return _isNotAcceptableValue(param);
  }

  static isAcceptableValue(param) {
    return _isAcceptableValue(param);
  }

  // Returns true if the parameter is NOT a valid Javascript
  //    Object for this application, i.e.
  // is ArrayBuffer OR
  // is Buffer OR
  // is Uint8Array OR
  // is Error OR
  // is Map OR
  // is WeakMap OR
  // is Set OR
  // is WeakSet OR
  // is Symbol OR
  // is RegExp OR
  // false otherwise.
  static isNotValidJavascriptObject(param) {
    return _isNotValidJavascriptObject(param);
  }

  static isNotValidArray(param) {
    return _isNotValidArray(param);
  }

  static isSet(param) {
    return _isSet(param);
  }

  static isMap(param) {
    return _isMap(param);
  }
}

// ---------- private functions that I can call inside this class ----------
// Also, I exposed some of these functions using static methods (without `_`)
function _isNotAcceptableValue(param) {
  return _.isFunction(param) || _isNotValidJavascriptObject(param) ||
   _.isNil(param) || _.isNaN(param);
}

function _isAcceptableValue(param) {
  return !_isNotAcceptableValue(param);
}

function _isNotValidJavascriptObject(p) {
  return  _.isBuffer(p) || _.isError(p) ||
  _.isRegExp(p) ||  _.isSymbol(p) ||
  _isSet(p) || _isMap(p) || _isNotValidArray(p);
}

function _isNotValidArray(p) {
  return _.isArrayBuffer(p) || _.isTypedArray(p);
}

function _isNotValidNumber(p) {
  return !_.isNumber(p) || _.isNaN(p);
}

function _isNotStringArrayObject(p) {
  return !_isStringOrArrayOrObject(p);
}

function _isStringOrArrayOrObject(p) {
  return _.isString(p) || _.isArray(p) || _.isObject(p);
}

function _isSet(p) {
  return _.isSet(p) || _.isWeakSet(p);
}

function _isMap(p) {
  return _.isMap(p) || _.isWeakMap(p);
}

module.exports = Utils;
