'use strict';

const URL_CLIENT_LOGIN_PAGE = '/login';

class TestUtils {

  constructor(agent) {
    this._agent = agent;
    this._csrftoken = null;
    this._connectionSid = null;
  }

  get agent() {
    return this._agent;
  }
  get csrftoken() {
    return this._csrftoken;
  }
  get connectionSid() {
    return this._connectionSid;
  }

  updateCookiesAndTokens (done, apiUrl = URL_CLIENT_LOGIN_PAGE) {
    this._agent
      .get(apiUrl)
      .end((err, res) => {
        if(err) {
          done(err);
        } else {
          this._csrftoken = (res.headers['set-cookie']).filter(value => value.includes('XSRF-TOKEN'))[0];
          this._connectionSid = (res.headers['set-cookie']).filter(value => value.includes('connect.sid'))[0];
          this._csrftoken = this._csrftoken ? this._csrftoken.split(';')[0].replace('XSRF-TOKEN=','') : '';
          this._connectionSid = this._connectionSid ? this._connectionSid.split(';')[0].replace('connect.sid=','') : '';
          done();
        }
      });
  }

  getPartialPostRequest (apiUrl) {
    return this._agent
      .post(apiUrl)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('set-cookie', 'connect.sid=' + this._connectionSid)
      .set('set-cookie', 'XSRF-TOKEN=' + this._csrftoken);
  }

  getPartialGetRequest (apiUrl) {
    return this._agent
      .get(apiUrl)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
  }
}

module.exports = TestUtils;
