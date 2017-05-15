'use strict';

function AuthLocalUserError(message) {
  this.message = message;
  this.name = 'AuthLocalUserError';
  Error.captureStackTrace(this, AuthLocalUserError);
}
AuthLocalUserError.prototype = Object.create(Error.prototype);
AuthLocalUserError.prototype.constructor = AuthLocalUserError;
module.exports = AuthLocalUserError;


function UpdateUserError(message) {
  this.message = message;
  this.name = 'UpdateUserError';
  Error.captureStackTrace(this, UpdateUserError);
}
UpdateUserError.prototype = Object.create(Error.prototype);
UpdateUserError.prototype.constructor = UpdateUserError;
module.exports = UpdateUserError;


function CollapseUserError(message) {
  this.message = message;
  this.name = 'CollapseUserError';
  Error.captureStackTrace(this, CollapseUserError);
}
CollapseUserError.prototype = Object.create(Error.prototype);
CollapseUserError.prototype.constructor = CollapseUserError;
module.exports = CollapseUserError;