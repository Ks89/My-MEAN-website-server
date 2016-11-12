// ------------- imported from app.js ---------------
module.exports = function (express) {
	let router = express.Router();
	let ctrlLogger = require('../controllers/logger');

	router.post('/debug', ctrlLogger.debug);
	router.post('/error', ctrlLogger.error);
	router.post('/exception', ctrlLogger.exception);

	module.exports = router;
	return router;
};
