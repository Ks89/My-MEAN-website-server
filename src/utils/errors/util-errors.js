// 'use strict';
//
// function TokenNotValidError(message) {
//   this.message = message;
//   this.name = 'TokenNotValidError';
//   Error.captureStackTrace(this, TokenNotValidError);
// }
// TokenNotValidError.prototype = Object.create(Error.prototype);
// TokenNotValidError.prototype.constructor = TokenNotValidError;
// module.exports = TokenNotValidError;
//
// function JwtNotValidError(message) {
//   this.message = message;
//   this.name = 'JwtNotValidError';
//   Error.captureStackTrace(this, JwtNotValidError);
// }
// JwtNotValidError.prototype = Object.create(Error.prototype);
// JwtNotValidError.prototype.constructor = JwtNotValidError;
// module.exports = JwtNotValidError;
//
// function JwtSessionExpiredError(message) {
//   this.message = message;
//   this.name = 'JwtSessionExpiredError';
//   Error.captureStackTrace(this, JwtSessionExpiredError);
// }
// JwtSessionExpiredError.prototype = Object.create(Error.prototype);
// JwtSessionExpiredError.prototype.constructor = JwtSessionExpiredError;
// module.exports = JwtSessionExpiredError;
//
// function JwtDecodingError(message) {
//   this.message = message;
//   this.name = 'JwtDecodingError';
//   Error.captureStackTrace(this, JwtDecodingError);
// }
// JwtDecodingError.prototype = Object.create(Error.prototype);
// JwtDecodingError.prototype.constructor = JwtDecodingError;
// module.exports = JwtDecodingError;
//
// function JwtUnknownError(message) {
//   this.message = message;
//   this.name = 'JwtUnknownError';
//   Error.captureStackTrace(this, JwtUnknownError);
// }
// JwtUnknownError.prototype = Object.create(Error.prototype);
// JwtUnknownError.prototype.constructor = JwtUnknownError;
// module.exports = JwtUnknownError;