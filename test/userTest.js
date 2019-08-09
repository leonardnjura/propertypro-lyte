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
  let oneRegularUserToken = '';
  let oneRegularUserId = '';
  let twoRegularUserToken = '';
  let twoRegularUserId = '';
  let oneSuperUserToken = '';
  const oneRegularUserData = {
    email: 'mona@localhost.com',
    password: '0000'
  };
  const twoRegularUserData = {
    email: 'valencia@localhost.com',
    password: '0000'
  };
  const oneSuperUserData = { email: 'obama@localhost.com', password: '4300' };
  const twoRegularUserInvalidCredentials = {
    email: 'valencia@localhost.com',
    password: 'B00B'
  };
  const twoRegularUserEmailTypo = {
    email: 'valen@localhost.com',
    password: 'B00B'
  };
  const twoRegularUserIncompleteData = { email: 'valencia@localhost.com' };
  const twoRegularUserEditData = { firstName: 'Valencia', lastName: 'Yessir' };
  const twoRegularUserBadEditData = { email: 'b@tmanandrobin.com', id: 6 };
  const twoRegularUserPromoteData = { isAdmin: true };

  const missingUser = 9999;
  const badInt = 'e9999000000000';

  before(done => {
    console.log('\n**BEFORE');
    // login one of dbomni present supers
    request(app)
      .post('/api/auth/signin')
      .send(oneSuperUserData)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        console.log('LOGIN ONE SUPERUSER HOOK', res.body);
        oneSuperUserToken = res.body.token;
      });

    request(app)
      .post('/api/auth/signup')
      .send(oneRegularUserData)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        console.log('REGISTER ONE REGULAR USER HOOK', res.body);
        oneRegularUserId = res.body.user.id;
        oneRegularUserToken = res.body.token;
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
    return done();
  });

  afterEach(done => {
    return done();
  });

  // test cases
  describe('Users api', () => {
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
          assert.typeOf(res.body, 'object');
          assert.equal(res.body.msg, 'welcome to propertypro lyte');
          assert.typeOf(res.body.saa, 'string');
          assert.typeOf(res.body.quote, 'string');
          assert.typeOf(res.body.karibu, 'string');
          assert.include(res.body.saa, ':');
          assert.property(res.body, 'msg');
          assert.lengthOf(res.body.msg, 27);
          return done();
        });
    });

    it('GET should return all users', done => {
      request(app)
        .get('/api/auth/users')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body.users[0], 'object');
          assert.property(res.body.users[0], 'id');
          assert.property(res.body.users[0], 'firstName');
          assert.property(res.body.users[0], 'lastName');
          assert.property(res.body.users[0], 'avatarUrl');
          return done();
        });
    });

    it('GET should search all users', done => {
      request(app)
        .get('/api/auth/users/search?term=jtest')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body.results[0], 'object');
          assert.property(res.body.results[0], 'id');
          assert.property(res.body.results[0], 'firstName');
          assert.property(res.body.results[0], 'lastName');
          assert.property(res.body.results[0], 'avatarUrl');
          return done();
        });
    });

    it('GET should return one user', done => {
      request(app)
        .get('/api/auth/users/1')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('ONE USER', res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body, 'object');
          assert.property(res.body, 'user');
          assert.property(res.body.user, 'id');
          assert.property(res.body.user, 'firstName');
          assert.property(res.body.user, 'lastName');
          assert.property(res.body.user, 'avatarUrl');
          return done();
        });
    });

    it('GET should return page not found on non-existent user', done => {
      request(app)
        .get(`/api/auth/users/${missingUser}`)
        .expect('Content-type', /json/)
        .expect(404) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.equal(res.status, 404);
          assert.include(res.body.msg, 'User not found');
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

    it('GET should catch db errors', done => {
      request(app)
        .get(`/api/auth/users/${badInt}`)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.equal(res.body.error.name, 'SequelizeDatabaseError');
          assert.equal(res.status, 400);
          return done();
        });
    });

    it('POST should register a user', done => {
      request(app)
        .post('/api/auth/signup')
        .send(twoRegularUserData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('REGISTER TWO REGULAR USER', res.body);
          twoRegularUserId = res.body.user.id;
          twoRegularUserToken = res.body.token;
          assert.property(res.body, 'token');
          assert.property(res.body, 'user');
          assert.property(res.body.user, 'createdAt');
          assert.equal(res.body.user.email, twoRegularUserData.email);
          assert.typeOf(res.body.token, 'string');
          assert.equal(res.status, 201);
          return done();
        });
    });

    it('POST shall not double register a user[email]', done => {
      request(app)
        .post('/api/auth/signup')
        .send(twoRegularUserData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'User already exists');
          assert.equal(res.status, 400);
          return done();
        });
    });

    it('POST shall not register without required fields', done => {
      request(app)
        .post('/api/auth/signup')
        .send(twoRegularUserIncompleteData)
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
        .post('/api/auth/signin')
        .send(twoRegularUserData)
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
        .post('/api/auth/signin')
        .send(twoRegularUserIncompleteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('LOGIN INVALID', res.body);
          assert.property(res.body, 'msg');
          assert.include(res.body.msg, 'Please login with email and password');
          return done();
        });
    });

    it('POST shall not login user with invalid credentials ', done => {
      request(app)
        .post('/api/auth/signin')
        .send(twoRegularUserInvalidCredentials)
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
        .post('/api/auth/signin')
        .send(twoRegularUserEmailTypo)
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
        .set('x-auth-token', twoRegularUserToken)
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
        .set('x-auth-token', twoRegularUserToken)
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
        // .set('x-auth-token', twoRegularUserToken)
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
        .put(`/api/auth/users/${twoRegularUserId}`)
        .set('x-auth-token', twoRegularUserToken)
        .send(twoRegularUserEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.property(res.body, 'success');
          assert.property(res.body.user, 'updatedAt');
          assert.include(res.body.msg, 'updated profile');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PUT shall not edit user account without owner token', done => {
      request(app)
        .put(`/api/auth/users/${twoRegularUserId}`)
        .set('x-auth-token', oneRegularUserToken)
        .send(twoRegularUserEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.include(res.body.msg, 'you are not the account owner');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('PUT admin may edit user account', done => {
      request(app)
        .put(`/api/auth/users/${twoRegularUserId}`)
        .set('x-auth-token', oneSuperUserToken)
        .send(twoRegularUserEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.include(res.body.msg, 'Admin updated profile');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PUT should promote user', done => {
      request(app)
        .put(`/api/auth/users/promote/${twoRegularUserId}`)
        .set('x-auth-token', oneSuperUserToken)
        .send(twoRegularUserPromoteData)
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

    it('PUT should promote user after validation', done => {
      request(app)
        .put(`/api/auth/users/promote/${twoRegularUserId}`)
        .set('x-auth-token', oneSuperUserToken)
        .send({ isCool: 'YahButNotNow' })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('HOW I PROMOTED VALENCIA', res.body);
          assert.include(res.body.errors[0].msg, 'isAdmin is required');
          assert.include(res.body.errors[1].msg, 'must be a boolean');
          assert.equal(res.status, 422);
          return done();
        });
    });

    it('PUT shall not promote user with missing token', done => {
      request(app)
        .put(`/api/auth/users/promote/${twoRegularUserId}`)
        // .set('x-auth-token', 'fooXorXexpiredXsuperXUserXToken')
        .send(twoRegularUserPromoteData)
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
        .put(`/api/auth/users/promote/${twoRegularUserId}`)
        .set('x-auth-token', 'fooXorXexpiredXsuperXUserXToken')
        .send(twoRegularUserPromoteData)
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
        .put(`/api/auth/users/promote/${twoRegularUserId}`)
        .set('x-auth-token', oneRegularUserToken)
        .send(twoRegularUserPromoteData)
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

    it('PUT shall not promote a missing user', done => {
      request(app)
        .put(`/api/auth/users/promote/${missingUser}`)
        .set('x-auth-token', oneSuperUserToken)
        .send(twoRegularUserPromoteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('PROMOTE NOT', res.body);
          assert.include(res.body.msg, 'User not found');
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('PUT shall not edit user email or id', done => {
      request(app)
        .put(`/api/auth/users/${twoRegularUserId}`)
        .set('x-auth-token', twoRegularUserToken)
        .send(twoRegularUserBadEditData)
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
        .put(`/api/auth/users/${missingUser}`)
        .set('x-auth-token', twoRegularUserToken)
        .send(twoRegularUserEditData)
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

    it('PUT shall not edit user with invalid token', done => {
      request(app)
        .put(`/api/auth/users/${twoRegularUserId}`)
        .set('x-auth-token', 'fooXorXexpiredXsuperXUserXToken')
        .send(twoRegularUserEditData)
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

    it('PUT should catch db errors', done => {
      request(app)
        .put(`/api/auth/users/${badInt}`)
        .set('x-auth-token', oneSuperUserToken)
        .send(twoRegularUserEditData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.equal(res.body.error.name, 'SequelizeDatabaseError');
          assert.equal(res.status, 400);
          return done();
        });
    });

    it('PUT promote should catch db errors', done => {
      request(app)
        .put(`/api/auth/users/promote/${badInt}`)
        .set('x-auth-token', oneSuperUserToken)
        .send(twoRegularUserPromoteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.equal(res.body.error.name, 'SequelizeDatabaseError');
          assert.equal(res.status, 400);
          return done();
        });
    });

    it('DELETE shall not expunge account without owner token', done => {
      request(app)
        .delete(`/api/auth/users/${twoRegularUserId}`)
        .set('x-auth-token', oneRegularUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'you are not the account owner');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('DELETE should delete user with correct headers', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/auth/users/${twoRegularUserId}`)
          .set('x-auth-token', twoRegularUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('DELETE TWO USER', res.body);
            assert.include(
              res.body.msg,
              `Account owner deleted account with ID: ${twoRegularUserId}`
            );
            assert.equal(res.status, 200);
          });
      }, 2000);
      return done();
    });

    it('DELETE admin may delete user', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/auth/users/${oneRegularUserId}`)
          .set('x-auth-token', oneSuperUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('DELETE ONE USER', res.body);
            assert.include(
              res.body.msg,
              `Admin deleted account with ID: ${oneRegularUserId}`
            );
            assert.equal(res.status, 200);
          });
      }, 2000);
      return done();
    });

    it('DELETE shall not expunge missing user', done => {
      request(app)
        .delete(`/api/auth/users/${missingUser}`)
        .set('x-auth-token', twoRegularUserToken)
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
        .delete('/api/auth/users/4')
        // .set('x-auth-token', twoRegularUserToken)
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

    it('DELETE should catch db errors', done => {
      request(app)
        .delete(`/api/auth/users/${badInt}`)
        .set('x-auth-token', oneSuperUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.equal(res.body.error.name, 'SequelizeDatabaseError');
          assert.equal(res.status, 400);
          return done();
        });
    });
  });
});
