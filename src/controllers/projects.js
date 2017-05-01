'use strict';

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var logger = require('../utils/logger-winston.js');

var Utils = require('../utils/util.js');

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
module.exports.projectsList = function(req, res) {
  console.log('projectsList');
  Project.find({}, (err, results) => {
    if (!results || err) {
      console.log('projectsList error:', err);
      Utils.sendJSONres(res, 404, "Project list not found");
      return;
    }
    if (results.length === 0) {
      console.log('projectsList is empty');
      res.status(204).end(); // no content (attention, don't use res.json() in this case)
    } else {
      Utils.sendJSONres(res, 200, results);
      return;
    }
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
module.exports.projectsListHomepage = function(req, res) {
  console.log('projectsListHomepage');
  Project
    .find({"projectHomeView.carouselImagePath": { $exists: true } })
    .lean().exec((err, results) => {
      if (!results || err) {
        console.log('projectsListHomepage error:', err);
        Utils.sendJSONres(res, 404, "Project list homepage not found");
        return;
      }
      if (results.length === 0) {
        console.log('projectsListHomepage is empty');
        res.status(204).end(); // no content (attention, don't use res.json() in this case)
      } else {
        Utils.sendJSONres(res, 200, results);
        return;
      }
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
module.exports.projectsReadOne = function(req, res) {
  console.log('Finding a Project', req.params);
  if (!req.params.projectid) {
    Utils.sendJSONres(res, 400, "No projectid in request");
    return;
  }

  Project
  .findById(req.params.projectid)
  .exec((err, project) => {
    if (!project || err) {
      Utils.sendJSONres(res, 404, "Project not found");
    } else {
      console.log(project);
      Utils.sendJSONres(res, 200, project);
    }
  });
};
