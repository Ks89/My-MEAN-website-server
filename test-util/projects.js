'use strict';

require('../src/models/projects');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let Project = mongoose.model('Project');

const PROJECT_NAME_1 = 'MockedProject';
const PROJECT_NAME_2 = 'MockedProject2';

class TestProjectsUtils {

  constructor(testUtils) {
    this._testUtils = testUtils;
  }

  readTestProjects(done) {
    let project1;
    Project.findOne({ 'name': PROJECT_NAME_1 })
      .then(prj1 => {
        project1 = prj1;
        return Project.findOne({'name': PROJECT_NAME_2});
      }).then(project2 => {
        done(null, [project1, project2]);
      }).catch(err => {
        done(err);
      });
  }

  insertProjectsTestDb(done) {
    let project = new Project();
    project.name = PROJECT_NAME_1;
    project.url = 'fakeUrl';
    project.description = 'fakeDescription';
    project.license = 'fakeLicense';
    project.visible = true;
    project.gallery = {
      thumb: 'fakeThumbPath',
      img: 'fakeImgPath',
      description: 'glleryFakeDescription'
    };
    project.authors = {
      name: 'name',
      surname: 'surname',
      url: 'url',
      urlAvailable: true
    };

    let project2 = new Project();
    project2.name = PROJECT_NAME_2;
    project2.url = 'fakeUrl2';
    project2.description = 'fakeDescription2';
    project2.license = 'fakeLicense2';
    project2.visible = false;
    project2.gallery = {
      thumb: 'fakeThumbPath2',
      img: 'fakeImgPath2',
      description: 'glleryFakeDescription2'
    };
    project2.authors = {
      name: 'name2',
      surname: 'surname2',
      url: 'url2',
      urlAvailable: false
    };
    project2.projectHomeView = {
      carouselImagePath: 'fakeCarouselPath2'
    };

    project.save()
      .then(prj => {
        project._id = prj._id;
        return project2.save();
      })
      .then(prj2 => {
        project2._id = prj2._id;
        done();
      })
      .catch(err => {
        fail('should not throw an error');
        done(err);
      });
  }

  dropProjectCollectionTestDb(done) {
    Project.remove({})
      .then(() => {
        done();
      }).catch(err => {
      fail('should not throw an error');
      done(err);
    });
  }
}

module.exports = TestProjectsUtils;
