'use strict';

let Utils = require('../utils/util.js');
let logger = require('../utils/logger-winston');
let Project = require('mongoose').model('Project');

/**
 * @api {get} /api/projects get all projects.
 * @apiVersion 0.0.1
 * @apiName GetProjects
 * @apiGroup Projects
 * @apiPermission none
 *
 * @apiDescription Get all projects.
 *
 * @apiSuccess {Object[]} pl Array of projects.
 * @apiSuccess {Object} pl.p An Object that represents a project.
 * @apiSuccess {String} pl.p._id Project's id.
 * @apiSuccess {String} pl.p.name Project name.
 * @apiSuccess {String} pl.p.url Github url to the project.
 * @apiSuccess {String} pl.p.iconPath Path of a png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.description Html string that represents the project description.
 * @apiSuccess {Boolean} pl.p.visibile Boolean used to hide/show a project.
 * @apiSuccess {Object} pl.p.projectHomeView Object that contains information used to show a project with carousel and thumbs.
 * @apiSuccess {String} pl.p.projectHomeView._id ProjectHomeView's id
 * @apiSuccess {String} pl.p.projectHomeView.carouselImagePath Path of the bigger png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.projectHomeView.carouselText CarouselImage description.
 * @apiSuccess {String} pl.p.projectHomeView.thumbImagePath Path of the smaller png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.projectHomeView.thumbText ThumbImage description.
 * @apiSuccess {String} pl.p.projectHomeView.bigThumbImagePath Path of the mid-size png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.projectHomeView.bigThumbText BigThumbImage description.
 * @apiSuccess {Date} pl.p.lastUpdate Date of the last update.
 * @apiSuccess {String[]} pl.p.filePaths Deprecated
 * @apiSuccess {Object[]} pl.p.gallery Array of gallery objects, with image, thumb and description.
 * @apiSuccess {String} pl.p.gallery.thumb Path of the thumb png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.gallery.img Path of the image png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.gallery.description Image description.
 * @apiSuccess {String[]} pl.p.futureExtensions Array of Html strings that represents the project's future extensions.
 * @apiSuccess {String[]} pl.p.features Array of Html strings that represents the project's features.
 * @apiSuccess {String[]} pl.p.releases Array of Html strings that represents the project's releases.
 * @apiSuccess {String[]} pl.p.changelog Array of Html strings that represents the project changelog, version by version.
 * @apiSuccess {String[]} pl.p.tags Array of Html strings that represents the project's tags.
 * @apiSuccess {Object[]} pl.p.authors Alrray of author objects, with personal information.
 * @apiSuccess {String} pl.p.authors.name Author's name.
 * @apiSuccess {String} pl.p.authors.surname Author's surname.
 * @apiSuccess {String} pl.p.authors.url Author's website/github profile.
 * @apiSuccess {Boolean} pl.p.authors.urlAvailable Boolean to used to show/hide author's url.
 *
 * @apiError ProjectsNotFound 404 Text message 'Project list not found'.
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 404 NOT FOUND
 *   {
 *     "message": "Project list not found"
 *   }
 */
module.exports.projectsList = function (req, res) {
  logger.debug('REST projects projectsList - finding projects');

  Project.find({}).then(results => {
    if (results.length === 0) {
      logger.debug('REST projects projectsList - list empty');
      res.status(204).end(); // no content (attention, don't use res.json() in this case)
    } else {
      logger.debug('REST projects projectsList - found', results);
      logger.silly(results);
      return Utils.sendJSONres(res, 200, results);
    }
  }).catch(err => {
    logger.error('REST projects projectsList - not found', err);
    return Utils.sendJSONres(res, 404, 'Project list not found');
  });
};

/**
 * @api {get} /api/projecthome get all home projects.
 * @apiVersion 0.0.1
 * @apiName GetHomeProjects
 * @apiGroup Projects
 * @apiPermission none
 *
 * @apiDescription Get all home projects.
 *
 * @apiSuccess {Object[]} pl Array of projects.
 * @apiSuccess {Object} pl.p An Object that represents a project.
 * @apiSuccess {String} pl.p._id Project's id.
 * @apiSuccess {String} pl.p.name Project name.
 * @apiSuccess {String} pl.p.url Github url to the project.
 * @apiSuccess {String} pl.p.iconPath Path of a png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.description Html string that represents the project description.
 * @apiSuccess {Boolean} pl.p.visibile Boolean used to hide/show a project.
 * @apiSuccess {Object} pl.p.projectHomeView Object that contains information used to show a project with carousel and thumbs.
 * @apiSuccess {String} pl.p.projectHomeView._id ProjectHomeView's id
 * @apiSuccess {String} pl.p.projectHomeView.carouselImagePath Path of the bigger png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.projectHomeView.carouselText CarouselImage description.
 * @apiSuccess {String} pl.p.projectHomeView.thumbImagePath Path of the smaller png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.projectHomeView.thumbText ThumbImage description.
 * @apiSuccess {String} pl.p.projectHomeView.bigThumbImagePath Path of the mid-size png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.projectHomeView.bigThumbText BigThumbImage description.
 * @apiSuccess {Date} pl.p.lastUpdate Date of the last update.
 * @apiSuccess {String[]} pl.p.filePaths Deprecated
 * @apiSuccess {Object[]} pl.p.gallery Array of gallery objects, with image, thumb and description.
 * @apiSuccess {String} pl.p.gallery.thumb Path of the thumb png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.gallery.img Path of the image png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} pl.p.gallery.description Image description.
 * @apiSuccess {String[]} pl.p.futureExtensions Array of Html strings that represents the project's future extensions.
 * @apiSuccess {String[]} pl.p.features Array of Html strings that represents the project's features.
 * @apiSuccess {String[]} pl.p.releases Array of Html strings that represents the project's releases.
 * @apiSuccess {String[]} pl.p.changelog Array of Html strings that represents the project changelog, version by version.
 * @apiSuccess {String[]} pl.p.tags Array of Html strings that represents the project's tags.
 * @apiSuccess {Object[]} pl.p.authors Alrray of author objects, with personal information.
 * @apiSuccess {String} pl.p.authors.name Author's name.
 * @apiSuccess {String} pl.p.authors.surname Author's surname.
 * @apiSuccess {String} pl.p.authors.url Author's website/github profile.
 * @apiSuccess {Boolean} pl.p.authors.urlAvailable Boolean to used to show/hide author's url.
 *
 * @apiError ProjectsNotFound 404 Text message 'Project list not found'.
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 404 NOT FOUND
 *   {
 *     "message": "Project list homepage not found"
 *   }
 */
module.exports.projectsListHomepage = function (req, res) {
  logger.debug('REST projects projectsListHomepage - finding projects for homepage');


  Project.find({'projectHomeView.carouselImagePath': {$exists: true}}).lean().exec().then(results => {
    if (results.length === 0) {
      logger.debug('REST projects projectsListHomepage - list empty');
      res.status(204).end(); // no content (attention, don't use res.json() in this case)
    } else {
      logger.debug('REST projects projectsListHomepage - found');
      logger.silly(results);
      return Utils.sendJSONres(res, 200, results);
    }
  }).catch(err => {
    logger.error('REST projects projectsListHomepage - not found', err);
    return Utils.sendJSONres(res, 404, 'Project list homepage not found');
  });
};


/**
 * @api {get} /api/projects/:projectid get a project with the requested projectid.
 * @apiVersion 0.0.1
 * @apiName GetProjectById
 * @apiGroup Projects
 * @apiPermission none
 *
 * @apiDescription Get a project by its <code>projectid</code>.
 *
 * @apiSuccess {Object} p An Object that represents a project.
 * @apiSuccess {String} p._id Project's id.
 * @apiSuccess {String} p.name Project name.
 * @apiSuccess {String} p.url Github url to the project.
 * @apiSuccess {String} p.iconPath Path of a png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} p.description Html string that represents the project description.
 * @apiSuccess {Boolean} p.visibile Boolean used to hide/show a project.
 * @apiSuccess {Object} p.projectHomeView Object that contains information used to show a project with carousel and thumbs.
 * @apiSuccess {String} p.projectHomeView._id ProjectHomeView's id
 * @apiSuccess {String} p.projectHomeView.carouselImagePath Path of the bigger png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} p.projectHomeView.carouselText CarouselImage description.
 * @apiSuccess {String} p.projectHomeView.thumbImagePath Path of the smaller png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} p.projectHomeView.thumbText ThumbImage description.
 * @apiSuccess {String} p.projectHomeView.bigThumbImagePath Path of the mid-size png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} p.projectHomeView.bigThumbText BigThumbImage description.
 * @apiSuccess {Date} p.lastUpdate Date of the last update.
 * @apiSuccess {String[]} p.filePaths Deprecated
 * @apiSuccess {Object[]} p.gallery Array of gallery objects, with image, thumb and description.
 * @apiSuccess {String} p.gallery.thumb Path of the thumb png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} p.gallery.img Path of the image png file. It's a file path inside 'assets' folder.
 * @apiSuccess {String} p.gallery.description Image description.
 * @apiSuccess {String[]} p.futureExtensions Array of Html strings that represents the project's future extensions.
 * @apiSuccess {String[]} p.features Array of Html strings that represents the project's features.
 * @apiSuccess {String[]} p.releases Array of Html strings that represents the project's releases.
 * @apiSuccess {String[]} p.changelog Array of Html strings that represents the project changelog, version by version.
 * @apiSuccess {String[]} p.tags Array of Html strings that represents the project's tags.
 * @apiSuccess {Object[]} p.authors Alrray of author objects, with personal information.
 * @apiSuccess {String} p.authors.name Author's name.
 * @apiSuccess {String} p.authors.surname Author's surname.
 * @apiSuccess {String} p.authors.url Author's website/github profile.
 * @apiSuccess {Boolean} p.authors.urlAvailable Boolean to used to show/hide author's url.
 *
 * @apiError NoProjectId 400 Text message 'No projectid in request'.
 * @apiError ProjectNotFound 404 Text message 'Project not found'.
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 404 NOT FOUND
 *   {
 *     "message": "Project not found"
 *   }
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 400 BAD REQUEST
 *   {
 *     "message": "No projectid in request"
 *   }
 */
module.exports.projectsReadOne = function (req, res) {
  logger.debug('REST projects projectsReadOne - finding one project', req.params);
  if (!req.params.projectid) {
    logger.error('REST projects projectsReadOne - :projectid not found');
    return Utils.sendJSONres(res, 400, 'No projectid in request');
  }

  Project.findById(req.params.projectid).exec().then(project => {
    logger.debug('REST projects projectsReadOne - found');
    logger.silly(project);
    return Utils.sendJSONres(res, 200, project);
  }).catch(err => {
    logger.error('REST projects projectsReadOne - not found', err);
    return Utils.sendJSONres(res, 404, 'Project not found');
  });
};
