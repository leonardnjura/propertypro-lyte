require('dotenv').config();

const { env } = process;
env.PORT = 5001;
env.NODE_ENV = 'test';

const { assert } = require('chai');

// For princess
const request = require('supertest');
const { app, server } = require('../server');

console.log('ENVIRONMENT:', env.NODE_ENV);
console.log('PORT:', env.PORT);

// Api unit and integration tests
describe('serverTests', () => {
  let oneUserToken = '';
  let oneUserId = '';
  let twoUserToken = '';
  let twoUserId = '';
  let superUserToken = '';
  const oneUserData = { email: 'esther@localhost.com', password: '0000' };
  const twoUserData = { email: 'valencia@localhost.com', password: '0000' };
  const superUserData = { email: 'obama@localhost.com', password: '4300' };
  const twoUserInvalidCredentials = {
    email: 'valencia@localhost.com',
    password: 'B00B'
  };
  const twoUserEmailTypo = {
    email: 'valen@localhost.com',
    password: 'B00B'
  };
  const twoUserIncompleteData = { email: 'valencia@localhost.com' };
  const twoUserEditData = { firstName: 'Valencia', lastName: 'Yessir' };
  const twoUserBadEditData = { email: 'b@tmanandrobin.com', id: 6 };
  const twoUserPromoteData = { isAdmin: true };
  const missingUser = 999;

  before(done => {
    console.log('\n**BEFORE');
    // login one of omni present supers
    request(app)
      .post('/api/auth')
      .send(superUserData)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        console.log('LOGIN SUPERUSER', res.body);
        superUserToken = res.body.token;
      });
    done();
  });

  after(done => {
    console.log('\nAFTER**');
    setTimeout(() => {
      server.close();
      console.log('Server closing..');
    }, 3000);
    done();
  });

  beforeEach(done => {
    console.log('\n*BEFORE EACH, CREATE DUMMY USER');
    // runs before each test in this block
    // create regular user
    request(app)
      .post('/api/users')
      .send(oneUserData)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        // console.log(res.body);
        oneUserId = res.body.user.id;
        oneUserToken = res.body.token;
        return done();
      });
  });

  afterEach(done => {
    console.log('\nAFTER EACH, DELETE DUMMY USER*');
    // runs after each test in this block
    request(app)
      .delete(`/api/users/${oneUserId}`)
      .set('x-auth-token', oneUserToken)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        // console.log(res.body);
        return done();
      });
  });

  // test cases
  describe('Api', () => {
    it('GET should return home page', done => {
      request(app)
        .get('/')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.equal(res.status, 200);
          assert.equal(res.body.msg, 'welcome to propertypro lyte');
          assert.typeOf(res.body, 'object');
          assert.property(res.body, 'msg');
          assert.lengthOf(res.body.msg, 27);
          return done();
        });
    });

    it('GET should return all users', done => {
      request(app)
        .get('/api/users')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body[0], 'object');
          assert.property(res.body[0], 'firstName');
          assert.property(res.body[0], 'lastName');
          assert.property(res.body[0], 'avatarUrl');
          return done();
        });
    });

    it('GET should return one user', done => {
      request(app)
        .get('/api/users/1')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('ONE USER', res.body);
          // assert.equal(res.status, 200);
          // assert.typeOf(res.body, 'object');
          // assert.property(res.body, 'firstName');
          // assert.property(res.body, 'lastName');
          // assert.property(res.body, 'avatarUrl');
          return done();
        });
    });

    it('GET should return page not found on non-existent user', done => {
      request(app)
        .get(`/api/users/${missingUser}`)
        .expect('Content-type', /json/)
        .expect(404) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('GET should return page not found on non-existent route', done => {
      request(app)
        .get('/oops')
        .expect('Content-type', /text/)
        .expect(404) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('POST should register user', done => {
      request(app)
        .post('/api/users')
        .send(twoUserData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          twoUserId = res.body.user.id;
          twoUserToken = res.body.token;
          assert.property(res.body, 'token');
          assert.property(res.body.user, 'createdAt');
          assert.equal(res.status, 201);
          return done();
        });
    });

    it('POST shall not register without required fields', done => {
      request(app)
        .post('/api/users')
        .send(twoUserIncompleteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.errors[0].msg, 'required');
          assert.equal(res.status, 422);
          return done();
        });
    });

    it('POST should login user', done => {
      request(app)
        .post('/api/auth')
        .send(twoUserData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.property(res.body, 'token');
          return done();
        });
    });

    it('POST shall not login user without email and password ', done => {
      request(app)
        .post('/api/auth')
        .send(twoUserIncompleteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('LOGIN INVALID', res.body);
          assert.property(res.body, 'msg');
          assert.include(res.body.msg, 'enter required fields');
          return done();
        });
    });

    it('POST shall not login user with invalid credentials ', done => {
      request(app)
        .post('/api/auth')
        .send(twoUserInvalidCredentials)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('LOGIN DECLINED', res.body);
          assert.property(res.body, 'msg');
          assert.include(res.body.msg, 'Invalid credentials');
          return done();
        });
    });

    it('POST shall catch if a login user is missing in the system', done => {
      request(app)
        .post('/api/auth')
        .send(twoUserEmailTypo)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('LOGIN DECLINED, EMAIL TYPO', res.body);
          assert.property(res.body, 'msg');
          assert.include(res.body.msg, 'User does not exist');
          return done();
        });
    });

    it('WHOAMI should determine current user', done => {
      request(app)
        .get('/api/auth/user')
        .set('x-auth-token', twoUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('WHOAMI', res.body);
          assert.typeOf(res.body, 'object');
          assert.typeOf(res.body.user.email, 'string');
          assert.typeOf(res.body.user.isAdmin, 'boolean');
          assert.property(res.body.user, 'id');
          assert.property(res.body.user, 'firstName');
          assert.property(res.body.user, 'lastName');
          assert.property(res.body.user, 'avatarUrl');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('WHOAMI should have redundancy', done => {
      request(app)
        .get('/api/auth/whoami')
        .set('x-auth-token', twoUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log('WHOAMI REDUNDANT', res.body);
          assert.typeOf(res.body, 'object');
          assert.typeOf(res.body.email, 'string');
          assert.property(res.body, 'id');
          assert.property(res.body, 'firstName');
          assert.property(res.body, 'lastName');
          assert.property(res.body, 'avatarUrl');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('WHOAMI shall not determine user if missing token', done => {
      request(app)
        .get('/api/auth/whoami')
        // .set('x-auth-token', twoUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log('WHOAMI', res.body);
          assert.typeOf(res.body, 'object');
          assert.typeOf(res.body.msg, 'string');
          assert.include(res.body.msg, 'No token provided');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('PUT should edit user', done => {
      request(app)
        .put(`/api/users/${twoUserId}`)
        .set('x-auth-token', twoUserToken)
        .send(twoUserEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.property(res.body, 'success');
          assert.property(res.body.user, 'updatedAt');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PUT should promote user', done => {
      request(app)
        .put(`/api/users/promote/${twoUserId}`)
        .set('x-auth-token', superUserToken)
        .send(twoUserPromoteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('VALENCIA PROMOTED', res.body);
          assert.property(res.body, 'success');
          assert.property(res.body.user, 'updatedAt');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PUT shall not promote user with missing token', done => {
      request(app)
        .put(`/api/users/promote/${twoUserId}`)
        // .set('x-auth-token', 'fooXorXexpiredXsuperXUserXToken')
        .send(twoUserPromoteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.include(res.body.msg, 'No token provided');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('PUT shall not promote user with invalid token', done => {
      request(app)
        .put(`/api/users/promote/${twoUserId}`)
        .set('x-auth-token', 'fooXorXexpiredXsuperXUserXToken')
        .send(twoUserPromoteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.include(res.body.msg, 'Invalid token');
          assert.equal(res.status, 400);
          return done();
        });
    });

    it('PUT shall not promote user without admin token', done => {
      request(app)
        .put(`/api/users/promote/${twoUserId}`)
        .set('x-auth-token', oneUserToken)
        .send(twoUserPromoteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.include(res.body.msg, 'Admin only');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('PUT shall not edit user email or id', done => {
      request(app)
        .put(`/api/users/${twoUserId}`)
        .set('x-auth-token', twoUserToken)
        .send(twoUserBadEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.property(res.body, 'errors');
          assert.include(res.body.errors[0].msg, 'required');
          assert.equal(res.status, 422);
          return done();
        });
    });

    it('PUT shall not edit on a missing user id', done => {
      request(app)
        .put(`/api/users/${missingUser}`)
        .set('x-auth-token', twoUserToken)
        .send(twoUserEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.typeOf(res.body.success, 'boolean');
          assert.equal(res.body.success, false);
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('PUT should edit user with valid token', done => {
      request(app)
        .put(`/api/users/${twoUserId}`)
        .set('x-auth-token', 'fooXorXexpiredXsuperXUserXToken')
        .send(twoUserEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.include(res.body.msg, 'Invalid token');
          assert.equal(res.status, 400);
          return done();
        });
    });

    it('DELETE should delete user', done => {
      request(app)
        .delete(`/api/users/${twoUserId}`)
        .set('x-auth-token', twoUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('DELETE shall not expunge missing user', done => {
      request(app)
        .delete(`/api/users/${missingUser}`)
        .set('x-auth-token', twoUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.typeOf(res.body.success, 'boolean');
          assert.equal(res.body.success, false);
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('DELETE is protected and requires token', done => {
      request(app)
        .delete('/api/users/4')
        // .set('x-auth-token', twoUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.equal(res.body.msg, 'No token provided');
          assert.equal(res.status, 401);
          return done();
        });
    });
  });
});
