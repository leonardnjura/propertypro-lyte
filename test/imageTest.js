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
  let oneImageId = '';
  let twoImageId = '';
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
  const oneImageData = {
    imageCaption: 'Bedroom',
    imageUrl: `http://pixbay.com/1${Date.now()}.jpg`
  };
  const oneImageIncompleteData = {
    imageCaption: 'Pantry'
  };
  const twoImageData = {
    imageCaption: 'Bathroom',
    imageUrl: `http://pixbay.com/2${Date.now()}.jpg`
  };
  const threeImageData = {
    imageCaption: 'Balcony',
    imageUrl: `http://pixbay.com/3${Date.now()}.jpg`
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
    email: 'johnnytest_image@localhost.com',
    password: '0000'
  };

  const missingImage = 9999;
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
    it('GET should return all images', done => {
      request(app)
        .get('/api/images')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body.images[0], 'object');
          assert.property(res.body.images[0], 'id');
          assert.property(res.body.images[0], 'propertyId');
          assert.property(res.body.images[0], 'imageCaption');
          assert.property(res.body.images[0], 'imageUrl');
          return done();
        });
    });

    it('GET should search all images', done => {
      request(app)
        .get('/api/images/search?term=room')
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
          assert.property(res.body.results[0], 'imageCaption');
          assert.property(res.body.results[0], 'imageUrl');
          return done();
        });
    });

    it('GET should return one image', done => {
      request(app)
        .get('/api/images/1')
        .expect('Content-type', /json/)
        .expect(200) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('ONE IMAGE', res.body);
          assert.equal(res.status, 200);
          assert.typeOf(res.body, 'object');
          assert.property(res.body, 'image');
          assert.property(res.body.image, 'id');
          assert.property(res.body.image, 'propertyId');
          assert.property(res.body.image, 'imageCaption');
          assert.property(res.body.image, 'imageUrl');
          return done();
        });
    });

    it('GET should return page not found on non-existent image', done => {
      request(app)
        .get(`/api/images/${missingImage}`)
        .expect('Content-type', /json/)
        .expect(404) // http status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body)
          assert.equal(res.status, 404);
          assert.include(res.body.msg, 'Image not found');
          return done();
        });
    });

    it('GET should catch db errors', done => {
      request(app)
        .get(`/api/images/${badInt}`)
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

    it('POST should add a property image', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/images`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneImageData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('REGISTER ONE PROPERTY IMAGE', res.body);
            oneImageId = res.body.image.id;
            assert.property(res.body, 'success');
            assert.property(res.body.image, 'imageCaption');
            assert.property(res.body.image, 'imageUrl');
            assert.property(res.body.image, 'createdAt');
            assert.include(res.body.msg, 'Property owner added image');
            assert.equal(res.body.realOwner, oneRegularUserId);
            assert.equal(res.body.surfer, oneRegularUserId);
            assert.equal(res.status, 201);
          });
      }, 2500); // after t=2000 ops
      return done();
    });

    it('POST admin may add a property image', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/images`)
          .set('x-auth-token', oneSuperUserToken)
          .send(threeImageData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('ADMIN REGISTER ONE PROPERTY IMAGE', res.body);
            assert.property(res.body, 'success');
            assert.property(res.body.image, 'imageCaption');
            assert.property(res.body.image, 'imageUrl');
            assert.property(res.body.image, 'createdAt');
            assert.include(res.body.msg, 'Admin added image');
            assert.equal(res.body.realOwner, oneRegularUserId);
            assert.equal(res.body.surfer, oneSuperUserId);
            assert.equal(res.status, 201);
          });
      }, 2500); // after t=2000 ops
      return done();
    });

    it('POST nobody else should add a property image', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/images`)
          .set('x-auth-token', twoRegularUserToken)
          .send(oneImageData)
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

    it('POST should add another property image', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${twoPropertyId}/images`)
          .set('x-auth-token', twoRegularUserToken)
          .send(twoImageData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('REGISTER TWO PROPERTY IMAGE', res.body);
            twoImageId = res.body.image.id;
            assert.property(res.body, 'success');
            assert.property(res.body.image, 'imageCaption');
            assert.property(res.body.image, 'imageUrl');
            assert.property(res.body.image, 'createdAt');
            assert.equal(res.status, 201);
          });
      }, 2500); // after t=2000 ops
      return done();
    });

    it('POST shall not double register a property image[imageUrl]', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/images`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneImageData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('DOUBLE REGISTER ONE PROPERTY IMAGE', res.body);
            assert.include(res.body.msg, 'Oops, this image is already listed');
            assert.equal(res.status, 400);
          });
      }, 2750); // after t=2500 ops
      return done();
    });

    it('POST shall not add image on a missing property', done => {
      request(app)
        .post(`/api/properties/${missingProperty}/images`)
        .set('x-auth-token', oneRegularUserToken)
        .send(oneImageData)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          console.log('IMAGE ON MISSING PROPERTY, YIKES', res.body);
          assert.include(res.body.msg, 'Property not found');
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('POST non-existent user shall not register an image', done => {
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
          .post(`/api/properties/${onePropertyId}/images`)
          .set('x-auth-token', threeRegularUserToken)
          .send(oneImageData)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            console.log('NON EXISTENT USER', res.body);
            assert.include(
              res.body.msg,
              'Cannot create image with nonexistent user'
            );
            assert.equal(res.status, 400);
          });
      }, 2500);
      return done();
    });

    it('POST shall not add image without required fields', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/images`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneImageIncompleteData)
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

    it('POST shall not add image without token', done => {
      setTimeout(() => {
        request(app)
          .post(`/api/properties/${onePropertyId}/images`)
          // .set('x-auth-token', oneRegularUserToken)
          .send(oneImageIncompleteData)
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
          .post(`/api/properties/${badInt}/images`)
          .set('x-auth-token', oneRegularUserToken)
          .send(oneImageData)
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

    it('DELETE should expunge image', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/images/${oneImageId}`)
          .set('x-auth-token', oneRegularUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(res.body.msg, `Property owner deleted image`);
            assert.equal(res.status, 200);
          });
      }, 2950);
      return done();
    });

    it('DELETE shall not expunge image without owner token', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/images/${twoImageId}`)
          .set('x-auth-token', oneRegularUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(
              res.body.msg,
              'you are not the property image owner'
            );
            assert.equal(res.status, 401);
            assert.notEqual(res.body.realOwner, oneRegularUserId);
          });
      }, 2850);
      return done();
    });

    it('DELETE shall not expunge image with nonexistent user', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/images/${twoImageId}`)
          .set('x-auth-token', threeRegularUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(
              res.body.msg,
              'Cannot delete image with nonexistent user'
            );
            assert.equal(res.status, 400);
          });
      }, 2850);
      return done();
    });

    it('DELETE admin may expunge image', done => {
      setTimeout(() => {
        request(app)
          .delete(`/api/images/${twoImageId}`)
          .set('x-auth-token', oneSuperUserToken)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // console.log(res.body);
            assert.include(res.body.msg, `Admin deleted image`);
            assert.equal(res.status, 200);
          });
      }, 2950);
      return done();
    });

    it('DELETE shall not expunge a missing image', done => {
      request(app)
        .delete(`/api/images/${missingImage}`)
        .set('x-auth-token', oneSuperUserToken)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          // console.log(res.body);
          assert.include(res.body.msg, 'Image not found');
          assert.equal(res.status, 404);
          return done();
        });
    });

    it('DELETE should catch db errors', done => {
      request(app)
        .delete(`/api/images/${badInt}`)
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
