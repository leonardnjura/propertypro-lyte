require('dotenv').config();

const { env } = process;
env.PORT = 5001;
env.NODE_ENV = 'test';

const { assert } = require('chai');

// For valentina
const request = require('supertest');
const { app, server } = require('../server');

console.log('ENVIRONMENT:', env.NODE_ENV);
console.log('PORT:', env.PORT);

// Api unit and integration tests
describe('serverTests', () => {
  let oneRegularUserId = '';
  let oneRegularUserToken = '';
  let twoRegularUserToken = '';
  let twoRegularUserId = '';
  let threeRegularUserToken = '';
  let threeRegularUserId = '';
  let oneSuperUserToken = '';
  let oneSuperUserId = '';
  let onePropertyId = '';
  let twoPropertyId = '';
  let oneFlagId = '';
  let twoFlagId = '';
  const onePropertyData = {
    price: '55000',
    state: 'Kenya',
    city: 'Westlands',
    address: 'Ojijo Rd',
    type: '5-bedroom maisonette',
    imageUrl: `https://www.sony.com/image/1${Date.now()}.jpg`
  };
  const twoPropertyData = {
    price: '15000',
    state: 'Kenya',
    city: 'Eastlands',
    address: 'Jogoo Rd',
    type: '2-bedroom flat',
    imageUrl: `https://www.sony.com/image/2${Date.now()}.jpg`
  };
  const oneFlagData = {
    reason: 'pricing',
    description: `This home is highly priced beacuse of blablabla1${Date.now()}`
  };
  const oneFlagIncompleteData = {
    reason: 'location'
  };
  const twoFlagData = {
    reason: 'location',
    description: `Located on the east coast coz a blablabla2${Date.now()}`
  };
  const threeFlagData = {
    reason: 'location',
    description: `Located on hbay swim canyon aka fisherman cove3${Date.now()}`
  };

  const oneSuperUserLogin = { email: 'obama@localhost.com', password: '4300' };
  const oneRegularUserLogin = {
    email: 'theo@localhost.com',
    password: '0400'
  };
  const twoRegularUserLogin = {
    email: 'pendo@localhost.com',
    password: '1000'
  };
  const threeRegularUserLogin = {
    email: 'johnnytest_flag@localhost.com',
    password: '0000'
  };

  const missingFlag = 9999;
  const missingProperty = 9999;
  const badInt = 'e9999000000000';
  let johnnytestCreated = false;

  before(done => {
    console.log('\n**BEFORE');
    // login one of db omni present regulars and supers
    // login hook
    request(app)
      .post('/api/auth/signin')
      .send(oneSuperUserLogin)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        console.log('LOGIN SUPER HOOK', res.body);
        oneSuperUserToken = res.body.token;
        oneSuperUserId = res.body.user.id;
      });

    // login hook
    request(app)
      .post('/api/auth/signin')
      .send(oneRegularUserLogin)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        console.log('LOGIN ONE REGULAR HOOK', res.body);
        oneRegularUserToken = res.body.token;
        oneRegularUserId = res.body.user.id;
      });

    // login hook
    request(app)
      .post('/api/auth/signin')
      .send(twoRegularUserLogin)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        console.log('LOGIN TWO REGULAR HOOK', res.body);
        twoRegularUserToken = res.body.token;
        twoRegularUserId = res.body.user.id;
      });

    setTimeout(() => {
      request(app)
        .post('/api/properties/')
        .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('REGISTER ONE PROPERTY HOOK', res.body);
          onePropertyId = res.body.property.id;
          // return done();
        });

      request(app)
        .post('/api/properties/')
        .set('x-auth-token', twoRegularUserToken)
        .send(twoPropertyData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('REGISTER TWO PROPERTY HOOK', res.body);
          twoPropertyId = res.body.property.id;
          // return done();
        });
    }, 2000);

    /**
     * JOHNNYTEST, THE RISE OF
     * create fly dummy user johnnytest for a valid token then later
     * delete him and test if non-existent user ca complete listing a
     * property with a 'valid' token
     */
    request(app)
      .post('/api/auth/signup')
      .send(threeRegularUserLogin)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        console.log('CREATE JOHNNYTEST HOOK', res.body);
        threeRegularUserId = res.body.user.id;
        threeRegularUserToken = res.body.token;
        johnnytestCreated = true;
      });

    /**
     * JOHNNYTEST, THE FALL OF
     * delete johnnytest already?
     * no wait till created, see this console hint
     */
    console.log('JOHNNYTEST READY', johnnytestCreated);

    done();
  });

  beforeEach(done => {
    // console.log('JOHNNYTEST USER READY', johnnytestCreated);
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

  // test cases
  describe('Properties api', () => {
    it('GET should return all flags', done => {
      request(app)
        .get('/api/flags')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body.flags[0], 'object');
          assert.property(res.body.flags[0], 'id');
          assert.property(res.body.flags[0], 'propertyId');
          assert.property(res.body.flags[0], 'reason');
          assert.property(res.body.flags[0], 'description');
          return done();
        });
    });

    it('GET should search all flags', done => {
      request(app)
        .get('/api/flags/search?term=kericho')
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
          assert.property(res.body.results[0], 'propertyId');
          assert.property(res.body.results[0], 'reason');
          assert.property(res.body.results[0], 'description');
          return done();
        });
    });

    it('GET should return one flag', done => {
      request(app)
        .get('/api/flags/3')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('ONE FLAG', res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body, 'object');
          assert.property(res.body, 'flag');
          assert.property(res.body.flag, 'id');
          assert.property(res.body.flag, 'propertyId');
          assert.property(res.body.flag, 'reason');
          assert.property(res.body.flag, 'description');
          return done();
        });
    });

    it('GET should return page not found on non-existent flag', done => {
      request(app)
        .get(`/api/flags/${missingFlag}`)
        .expect('Content-type', /json/)
        .expect(404) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.equal(res.status, 404);
          assert.include(res.body.msg, 'Flag not found');
          return done();
        });
    });

    it('GET should catch db errors', done => {
      request(app)
        .get(`/api/flags/${badInt}`)
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

    it('POST should add a property flag', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/flags`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneFlagData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('REGISTER ONE PROPERTY FLAG', res.body);
            oneFlagId = res.body.flag.id;
            assert.property(res.body, 'success');
            assert.property(res.body.flag, 'reason');
            assert.property(res.body.flag, 'description');
            assert.property(res.body.flag, 'createdAt');
            assert.include(res.body.msg, 'Property owner added flag');
            assert.equal(res.body.realOwner, oneRegularUserId);
            assert.equal(res.body.surfer, oneRegularUserId);
            assert.equal(res.status, 201);
          });
      }, 2500); // after t=2000 ops
      return done();
    });

    it('POST admin may add a property flag', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/flags`)
          .set('x-auth-token', oneSuperUserToken)
          .send(threeFlagData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('ADMIN REGISTER ONE PROPERTY FLAG', res.body);
            assert.property(res.body, 'success');
            assert.property(res.body.flag, 'reason');
            assert.property(res.body.flag, 'description');
            assert.property(res.body.flag, 'createdAt');
            assert.include(res.body.msg, 'Admin added flag');
            assert.equal(res.body.realOwner, oneRegularUserId);
            assert.equal(res.body.surfer, oneSuperUserId);
            assert.equal(res.status, 201);
          });
      }, 2500); // after t=2000 ops
      return done();
    });

    it('POST nobody else should add a property flag', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/flags`)
          .set('x-auth-token', twoRegularUserToken)
          .send(oneFlagData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.equal(res.body.success, false);
            assert.include(
              res.body.msg,
              'Oops, you are not the property owner'
            );
            assert.equal(res.body.realOwner, oneRegularUserId);
            assert.equal(res.body.surfer, twoRegularUserId);
            assert.equal(res.status, 401);
          });
      }, 2500); // after t=2000 ops
      return done();
    });

    it('POST should add another property flag', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${twoPropertyId}/flags`)
          .set('x-auth-token', twoRegularUserToken)
          .send(twoFlagData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('REGISTER TWO PROPERTY FLAG', res.body);
            twoFlagId = res.body.flag.id;
            assert.property(res.body, 'success');
            assert.property(res.body.flag, 'reason');
            assert.property(res.body.flag, 'description');
            assert.property(res.body.flag, 'createdAt');
            assert.equal(res.status, 201);
          });
      }, 2500); // after t=2000 ops
      return done();
    });

    it('POST shall not double register a property flag[description]', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/flags`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneFlagData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('DOUBLE REGISTER ONE PROPERTY FLAG', res.body);
            assert.include(res.body.msg, 'Oops, this flag is already up');
            assert.equal(res.status, 400);
          });
      }, 2750); // after t=2500 ops
      return done();
    });

    it('POST shall not add flag on a missing property', done => {
      request(app)
        .post(`/api/properties/${missingProperty}/flags`)
        .set('x-auth-token', oneRegularUserToken)
        .send(oneFlagData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('FLAG ON MISSING PROPERTY, YIKES', res.body);
          assert.include(res.body.msg, 'Property not found');
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('POST non-existent user shall not register an flag', done => {
      /**
       * PREOPS: delay successful expunge for user to be created in
       * before hook, If created user is used only here you may
       * signup johnnytest user this sequence */
      setTimeout(() => {
        request(app)
          .delete(`/api/auth/users/${threeRegularUserId}`)
          .set('x-auth-token', oneSuperUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('DELETE MISSY', res.body);
            assert.include(
              res.body.msg,
              `Admin deleted account with ID: ${threeRegularUserId}`
            );
            assert.equal(res.status, 200);
          });
      }, 2000);
      /**
       * OPS: token of expunged user invalidated below */
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/flags`)
          .set('x-auth-token', threeRegularUserToken)
          .send(oneFlagData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('NON EXISTENT USER', res.body);
            assert.include(
              res.body.msg,
              'Cannot create flag with nonexistent user'
            );
            assert.equal(res.status, 400);
          });
      }, 2500);
      return done();
    });

    it('POST shall not add flag without required fields', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/flags`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneFlagIncompleteData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log(res.body);
            assert.include(res.body.errors[0].msg, 'required');
            assert.equal(res.status, 422);
          });
      }, 2500);
      return done();
    });

    it('POST shall not add flag without token', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/flags`)
          // .set('x-auth-token', oneRegularUserToken)
          .send(oneFlagIncompleteData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(res.body.msg, 'No token provided');
            assert.equal(res.status, 401);
          });
      }, 2500);
      return done();
    });

    it('POST should catch db errors', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${badInt}/flags`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneFlagData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.equal(res.body.error.name, 'SequelizeDatabaseError');
            assert.equal(res.status, 400);
          });
      }, 2500);
      return done();
    });

    it('DELETE should expunge flag', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/flags/${oneFlagId}`)
          .set('x-auth-token', oneRegularUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(res.body.msg, `Property owner deleted flag`);
            assert.equal(res.status, 200);
          });
      }, 2850);
      return done();
    });

    it('DELETE shall not expunge flag without owner token', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/flags/${twoFlagId}`)
          .set('x-auth-token', oneRegularUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(res.body.msg, 'you are not the property flag owner');
            assert.equal(res.status, 401);
            assert.notEqual(res.body.realOwner, oneRegularUserId);
          });
      }, 2850);
      return done();
    });

    it('DELETE shall not expunge flag with nonexistent user', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/flags/${twoFlagId}`)
          .set('x-auth-token', threeRegularUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(
              res.body.msg,
              'Cannot delete flag with nonexistent user'
            );
            assert.equal(res.status, 400);
          });
      }, 2850);
      return done();
    });

    it('DELETE admin may expunge flag', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/flags/${twoFlagId}`)
          .set('x-auth-token', oneSuperUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(res.body.msg, `Admin deleted flag`);
            assert.equal(res.status, 200);
          });
      }, 2850);
      return done();
    });

    it('DELETE shall not expunge a missing flag', done => {
      request(app)
        .delete(`/api/flags/${missingFlag}`)
        .set('x-auth-token', oneSuperUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'Flag not found');
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('DELETE should catch db errors', done => {
      request(app)
        .delete(`/api/flags/${badInt}`)
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
