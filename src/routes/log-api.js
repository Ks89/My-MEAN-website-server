'use strict';

let ctrlLogger = require('../controllers/logger');

// ------------- imported from app.js ---------------
module.exports = function (express) {
	let router = express.Router();

	router.post('/debug', ctrlLogger.debug);
	router.post('/error', ctrlLogger.error);
	router.post('/exception', ctrlLogger.exception);

	module.exports = router;
	return router;
};
