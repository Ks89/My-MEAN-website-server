'use strict';

const APIS = require('./apis');

let ctrlLogger = require('../controllers/logger');

// ------------- imported from app.js ---------------
module.exports = function (express) {
	let router = express.Router();

	router.post(APIS.POST_LOG_DEBUG, ctrlLogger.debug);
	router.post(APIS.POST_LOG_ERROR, ctrlLogger.error);
	router.post(APIS.POST_LOG_EXCEPTION, ctrlLogger.exception);

	module.exports = router;
	return router;
};
