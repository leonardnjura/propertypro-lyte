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
  let oneRegularUserToken = '';
  let twoRegularUserToken = '';
  let threeRegularUserToken = '';
  let threeRegularUserId = '';
  let oneSuperUserToken = '';
  let onePropertyId = '';
  let twoPropertyId = '';
  const onePropertyData = {
    price: '55000',
    state: 'Kenya',
    city: 'Westlands',
    address: 'Ojijo Rd',
    type: '5-bedroom maisonette',
    imageUrl: `https://www.sony.com/image/1${Date.now()}.jpg`
  };
  const onePropertyIncompleteData = {
    price: '55000',
    // state: 'Kenya',
    // city: 'Westlands',
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
  const onePropertyUpdateStatusData = { status: 'sold' };
  const onePropertyUpdateInfoData = { price: '51000', address: 'New Ojijo Rd' };

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
    email: 'johnnytest@localhost.com',
    password: '0000'
  };

  const missingProperty = 999;
  const badInt = 'e999000000000';
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
      });

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
    it('GET should return all properties', done => {
      request(app)
        .get('/api/properties')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body.properties[0], 'object');
          assert.property(res.body.properties[0], 'id');
          assert.property(res.body.properties[0], 'owner');
          assert.property(res.body.properties[0], 'status');
          assert.property(res.body.properties[0], 'price');
          assert.property(res.body.properties[0], 'imageUrl');
          return done();
        });
    });

    it('GET should search all properties', done => {
      request(app)
        .get('/api/properties/search?term=manyatta')
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
          assert.property(res.body.results[0], 'owner');
          assert.property(res.body.results[0], 'status');
          assert.property(res.body.results[0], 'price');
          assert.property(res.body.results[0], 'imageUrl');
          return done();
        });
    });

    it('GET should return one property', done => {
      request(app)
        .get('/api/properties/1')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('ONE PROPERTY', res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body, 'object');
          assert.property(res.body, 'property');
          assert.property(res.body.property, 'id');
          assert.property(res.body.property, 'owner');
          assert.property(res.body.property, 'status');
          assert.property(res.body.property, 'price');
          assert.property(res.body.property, 'imageUrl');
          return done();
        });
    });

    it('GET should return page not found on non-existent property', done => {
      request(app)
        .get(`/api/properties/${missingProperty}`)
        .expect('Content-type', /json/)
        .expect(404) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.equal(res.status, 404);
          assert.include(res.body.msg, 'Property not found');
          return done();
        });
    });

    it('GET should catch db errors', done => {
      request(app)
        .get(`/api/properties/${badInt}`)
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

    it('POST should register a property', done => {
      request(app)
        .post('/api/properties')
        .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('REGISTER ONE PROPERTY', res.body);
          onePropertyId = res.body.property.id;
          assert.property(res.body, 'success');
          assert.property(res.body.property, 'price');
          assert.property(res.body.property, 'imageUrl');
          assert.property(res.body.property, 'createdAt');
          assert.equal(res.status, 201);
          return done();
        });
    });

    it('POST shall not double register a property[imageUrl]', done => {
      request(app)
        .post('/api/properties')
        .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'Oops, this property is already listed');
          assert.equal(res.status, 400);
          return done();
        });
    });

    it('POST another user should register a property', done => {
      request(app)
        .post('/api/properties')
        .set('x-auth-token', twoRegularUserToken)
        .send(twoPropertyData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('REGISTER TWO PROPERTY', res.body);
          twoPropertyId = res.body.property.id;
          assert.property(res.body, 'success');
          assert.property(res.body.property, 'price');
          assert.property(res.body.property, 'imageUrl');
          assert.property(res.body.property, 'createdAt');
          assert.equal(res.status, 201);
          return done();
        });
    });

    it('POST non-existent user shall not register a property', done => {
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
            // return done();
          });
      }, 2000);
      /**
       * OPS: token of expunged user invalidated below */
      setTimeout(() => {
        request(app)
          .post('/api/properties')
          .set('x-auth-token', threeRegularUserToken)
          .send(twoPropertyData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('NON EXISTENT USER', res.body);
            assert.include(
              res.body.msg,
              'Cannot create property with nonexistent user'
            );
            assert.equal(res.status, 400);
          });
      }, 2500);
      return done();
    });

    it('POST shall not register property without required fields', done => {
      request(app)
        .post('/api/properties')
        .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyIncompleteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.include(res.body.errors[0].msg, 'required');
          assert.equal(res.status, 422);
          return done();
        });
    });

    it('POST shall not register property without token', done => {
      request(app)
        .post('/api/properties')
        // .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyIncompleteData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'No token provided');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('PATCH should edit status of property', done => {
      request(app)
        .patch(`/api/properties/${onePropertyId}/sold`)
        .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyUpdateStatusData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.equal(res.body.property.status, 'sold');
          assert.include(res.body.msg, 'Property owner updated status');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PATCH shall not edit status if not with sold or available', done => {
      request(app)
        .patch(`/api/properties/${onePropertyId}/sold`)
        .set('x-auth-token', oneRegularUserToken)
        .send({ status: 'foo' })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(
            res.body.errors[0].msg,
            'status must be either sold or available'
          );
          assert.equal(res.status, 422);
          return done();
        });
    });

    it('PATCH shall not edit property status without owner token', done => {
      request(app)
        .patch(`/api/properties/${onePropertyId}/sold`)
        .set('x-auth-token', twoRegularUserToken)
        .send({ status: 'sold' })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'you are not the property owner');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('PATCH may edit property status with admin token', done => {
      request(app)
        .patch(`/api/properties/${onePropertyId}/sold`)
        .set('x-auth-token', oneSuperUserToken)
        .send(onePropertyUpdateStatusData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          //   console.log(res.body);
          assert.equal(res.body.property.status, 'sold');
          assert.include(res.body.msg, 'Admin updated status');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PUT should edit info of property', done => {
      request(app)
        .put(`/api/properties/${onePropertyId}`)
        .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyUpdateInfoData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          onePropertyId = res.body.property.id;
          assert.property(res.body, 'success');
          assert.property(res.body.property, 'price');
          assert.property(res.body.property, 'imageUrl');
          assert.property(res.body.property, 'createdAt');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PUT shall not edit a missing property', done => {
      request(app)
        .put(`/api/properties/${missingProperty}`)
        .set('x-auth-token', oneRegularUserToken)
        .send(onePropertyUpdateInfoData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'Property not found');
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('PUT shall not edit property info without owner token', done => {
      request(app)
        .put(`/api/properties/${onePropertyId}`)
        .set('x-auth-token', twoRegularUserToken)
        .send(onePropertyUpdateInfoData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'you are not the property owner');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('PUT may edit property info with admin token', done => {
      request(app)
        .put(`/api/properties/${onePropertyId}`)
        .set('x-auth-token', oneSuperUserToken)
        .send(onePropertyUpdateInfoData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'Admin updated info');
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('PUT should catch db errors', done => {
      request(app)
        .put(`/api/properties/${badInt}`)
        .set('x-auth-token', oneSuperUserToken)
        .send(onePropertyUpdateInfoData)
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

    it('DELETE should expunge property', done => {
      request(app)
        .delete(`/api/properties/${onePropertyId}`)
        .set('x-auth-token', oneRegularUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(
            res.body.msg,
            `Property owner deleted property with ID: ${onePropertyId}`
          );
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('DELETE shall not expunge property without owner token', done => {
      request(app)
        .delete(`/api/properties/${twoPropertyId}`)
        .set('x-auth-token', oneRegularUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'you are not the property owner');
          assert.equal(res.status, 401);
          return done();
        });
    });

    it('DELETE admin may expunge property', done => {
      request(app)
        .delete(`/api/properties/${twoPropertyId}`)
        .set('x-auth-token', oneSuperUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(
            res.body.msg,
            `Admin deleted property with ID: ${twoPropertyId}`
          );
          assert.equal(res.status, 200);
          return done();
        });
    });

    it('DELETE shall not expunge a missing property', done => {
      request(app)
        .delete(`/api/properties/${missingProperty}`)
        .set('x-auth-token', oneSuperUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'Property not found');
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('DELETE should catch db errors', done => {
      request(app)
        .delete(`/api/properties/${badInt}`)
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
