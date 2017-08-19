'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../src/routes/apis');

let expect = require('chai').expect;
let app = require('../app');
let agent = require('supertest').agent(app);
let async = require('async');

const TestUtils = require('../test-util/utils');
let testUtils = new TestUtils(agent);

const TestProjectsUtils = require('../test-util/projects');
let testProjectsUtils = new TestProjectsUtils(testUtils);

require('../src/models/projects');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let Project = mongoose.model('Project');

const URL_PROJECTS = APIS.BASE_API_PATH + APIS.GET_PROJECTS;
const URL_PROJECTHOME = APIS.BASE_API_PATH + APIS.GET_PROJECTHOME;
const URL_SINGLE_PROJECT = URL_PROJECTS + "/"; // I'll add here the path param below

describe('projects', () => {

	describe('#projectsList()', () => {
		describe('---YES---', () => {

			before(done => testProjectsUtils.insertProjectsTestDb(done));

			it('should correctly get a list of project', done => {
			  let project;
			  let project2;

        async.waterfall([
          asyncDone => {
            testProjectsUtils.readTestProjects(asyncDone);
          },
          (projects, asyncDone) => {
            project = projects[0];
            project2 = projects[1];

            testUtils.getPartialGetRequest(URL_PROJECTS)
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return asyncDone(err);
                }

                expect(res.body).to.be.not.null;
                expect(res.body).to.be.not.undefined;
                expect(res.body.length).to.be.equals(2);

                let prjToCheck;
                for(let prj of res.body) {
                  if(prj.name === project.name) {
                    prjToCheck = project;
                  } else if(prj.name === project2.name) {
                    expect(prj.projectHomeView.carouselImagePath).to.be.equals(project2.projectHomeView.carouselImagePath);
                    expect(prj.projectHomeView.carouselText).to.be.equals(project2.projectHomeView.carouselText);
                    expect(prj.projectHomeView.thumbImagePath).to.be.equals(project2.projectHomeView.thumbImagePath);
                    expect(prj.projectHomeView.thumbText).to.be.equals(project2.projectHomeView.thumbText);
                    expect(prj.projectHomeView.bigThumbImagePath).to.be.equals(project2.projectHomeView.bigThumbImagePath);
                    expect(prj.projectHomeView.bigThumbText).to.be.equals(project2.projectHomeView.bigThumbText);
                    prjToCheck = project2;
                  } else {
                    throw 'No project found';
                  }

                  expect(prj.name).to.be.equals(prjToCheck.name);
                  expect(prj.url).to.be.equals(prjToCheck.url);
                  expect(prj.description).to.be.equals(prjToCheck.description);
                  expect(prj.license).to.be.equals(prjToCheck.license);
                  expect(prj.visible).to.be.equals(prjToCheck.visible);
                  expect(prj.gallery.thumb).to.be.equals(prjToCheck.gallery.thumb);
                  expect(prj.gallery.img).to.be.equals(prjToCheck.gallery.img);
                  expect(prj.gallery.description).to.be.equals(prjToCheck.gallery.description);
                  expect(prj.authors.name).to.be.equals(prjToCheck.authors.name);
                  expect(prj.authors.surname).to.be.equals(prjToCheck.authors.surname);
                  expect(prj.authors.url).to.be.equals(prjToCheck.authors.url);
                  expect(prj.authors.urlAvailable).to.be.equals(prjToCheck.authors.urlAvailable);
                }
                asyncDone(null);
              });
          }
        ], err => done(err));
      });

			after(done => testProjectsUtils.dropProjectCollectionTestDb(done));
		});

		describe('---NO---', () => {

			before(done => testProjectsUtils.dropProjectCollectionTestDb(done));

			it('should catch 204 no content', done => {
				testUtils.getPartialGetRequest(URL_PROJECTS)
				.expect(204) // no content
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
						// no content => nothing :)
						expect(res.body).to.be.not.null;
						expect(res.body).to.be.not.undefined;
						done();
					}
				});
			});
		});
	});

	describe('#projectsListHomepage()', () => {
		describe('---YES---', () => {

			before(done => testProjectsUtils.insertProjectsTestDb(done));

			it('should correctly get a list of projects that contains carouselImagePath', done => {
        let project;
        let project2;

        async.waterfall([
          asyncDone => {
            testProjectsUtils.readTestProjects(asyncDone);
          },
          (projects, asyncDone) => {
            project = projects[0];
            project2 = projects[1];

            testUtils.getPartialGetRequest(URL_PROJECTHOME)
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return asyncDone(err);
                }

                expect(res.body).to.be.not.null;
                expect(res.body).to.be.not.undefined;
                expect(res.body.length).to.be.equals(1);

                for(let prj of res.body) {
                  if(prj.name === project2.name) {
                    expect(prj.projectHomeView.carouselImagePath).to.be.equals(project2.projectHomeView.carouselImagePath);
                    expect(prj.projectHomeView.carouselText).to.be.equals(project2.projectHomeView.carouselText);
                    expect(prj.projectHomeView.thumbImagePath).to.be.equals(project2.projectHomeView.thumbImagePath);
                    expect(prj.projectHomeView.thumbText).to.be.equals(project2.projectHomeView.thumbText);
                    expect(prj.projectHomeView.bigThumbImagePath).to.be.equals(project2.projectHomeView.bigThumbImagePath);
                    expect(prj.projectHomeView.bigThumbText).to.be.equals(project2.projectHomeView.bigThumbText);
                    expect(prj.name).to.be.equals(project2.name);
                    expect(prj.url).to.be.equals(project2.url);
                    expect(prj.description).to.be.equals(project2.description);
                    expect(prj.license).to.be.equals(project2.license);
                    expect(prj.visible).to.be.equals(project2.visible);
                    expect(prj.gallery.thumb).to.be.equals(project2.gallery.thumb);
                    expect(prj.gallery.img).to.be.equals(project2.gallery.img);
                    expect(prj.gallery.description).to.be.equals(project2.gallery.description);
                    expect(prj.authors.name).to.be.equals(project2.authors.name);
                    expect(prj.authors.surname).to.be.equals(project2.authors.surname);
                    expect(prj.authors.url).to.be.equals(project2.authors.url);
                    expect(prj.authors.urlAvailable).to.be.equals(project2.authors.urlAvailable);
                  }
                }
                asyncDone(null);
              });
          }
        ], err => done(err));
			});

			after(done => testProjectsUtils.dropProjectCollectionTestDb(done));
		});

		describe('---NO---', () => {

			before(done => testProjectsUtils.dropProjectCollectionTestDb(done));

			it('should catch 204 no content', done => {
				testUtils.getPartialGetRequest(URL_PROJECTHOME)
				.expect(204) // no content
				// end handles the response
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
						// no content => nothing :)
						expect(res.body).to.be.not.null;
						expect(res.body).to.be.not.undefined;
						done();
					}
				});
			});
		});
	});


	describe('#projectsReadOne()', () => {
		describe('---YES---', () => {

			before(done => testProjectsUtils.insertProjectsTestDb(done));

			it('should correctly get a single project by its id', done => {
        let project;
        let project2;

        async.waterfall([
          asyncDone => {
            testProjectsUtils.readTestProjects(asyncDone);
          },
          (projects, asyncDone) => {
            project = projects[0];
            project2 = projects[1];

            testUtils.getPartialGetRequest(URL_SINGLE_PROJECT + project2._id)
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return asyncDone(err);
                }

                let prj = res.body;
                expect(prj).to.be.not.null;
                expect(prj).to.be.not.undefined;
                expect(prj.projectHomeView.carouselImagePath).to.be.equals(project2.projectHomeView.carouselImagePath);
                expect(prj.projectHomeView.carouselText).to.be.equals(project2.projectHomeView.carouselText);
                expect(prj.projectHomeView.thumbImagePath).to.be.equals(project2.projectHomeView.thumbImagePath);
                expect(prj.projectHomeView.thumbText).to.be.equals(project2.projectHomeView.thumbText);
                expect(prj.projectHomeView.bigThumbImagePath).to.be.equals(project2.projectHomeView.bigThumbImagePath);
                expect(prj.projectHomeView.bigThumbText).to.be.equals(project2.projectHomeView.bigThumbText);
                expect(prj.name).to.be.equals(project2.name);
                expect(prj.url).to.be.equals(project2.url);
                expect(prj.description).to.be.equals(project2.description);
                expect(prj.license).to.be.equals(project2.license);
                expect(prj.visible).to.be.equals(project2.visible);
                expect(prj.gallery.thumb).to.be.equals(project2.gallery.thumb);
                expect(prj.gallery.img).to.be.equals(project2.gallery.img);
                expect(prj.gallery.description).to.be.equals(project2.gallery.description);
                expect(prj.authors.name).to.be.equals(project2.authors.name);
                expect(prj.authors.surname).to.be.equals(project2.authors.surname);
                expect(prj.authors.url).to.be.equals(project2.authors.url);
                expect(prj.authors.urlAvailable).to.be.equals(project2.authors.urlAvailable);

                asyncDone(null);
              });
          }
        ], err => done(err));
			});

			after(done => testProjectsUtils.dropProjectCollectionTestDb(done));
		});

		describe('---ERRORS---', () => {

			before(done => testProjectsUtils.dropProjectCollectionTestDb(done));

			it('should catch 404 not found and check the error message', done => {
				testUtils.getPartialGetRequest(URL_SINGLE_PROJECT + 'fake_id')
				.expect(404)
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
						expect(res.body).to.be.not.null;
						expect(res.body).to.be.not.undefined;
						expect(res.body.message).to.be.equals('Project not found');
						done();
					}
				});
			});
		});
	});
});
