'use strict';

const APIS = require('./apis');

// ------------- imported from ./index.js ---------------

module.exports = function (router) {
  let ctrlTesting = require('../controllers/testing');

  // -----------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------
  // 					 all these routes are authenticated because declared
  //           after the authentication middleware inside ./index.js
  // -----------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------

  router.get(APIS.GET_TESTING_DESTROY_SESSION, ctrlTesting.destroySession);
  router.get(APIS.GET_TESTING_STRING_SESSION, ctrlTesting.setStringSession);
  router.get(APIS.GET_TESTING_JSON_NO_TOKEN, ctrlTesting.setJsonWithoutTokenSession);
  router.get(APIS.GET_TESTING_JSON_WRONG_FORMAT_TOKEN, ctrlTesting.setJsonWithWrongFormatTokenSession);
  router.get(APIS.GET_TESTING_JSON_EXPIRED, ctrlTesting.setJsonWithExpiredDateSession);

	module.exports = router;
	return router;
};
