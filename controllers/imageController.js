const { check, validationResult } = require('express-validator');

const Sequelize = require('sequelize');
const { User, Property, Image } = require('../models/index');

const { Op } = Sequelize;

/**
 * REST */
exports.fetchAllImages = (req, res) => {
  Image.findAll({ limit: 100, order: [['updatedAt', 'DESC']] })
    .then(images => res.status(200).json({ images }))
    .catch(err => console.log(err));
};

exports.searchAllImages = (req, res) => {
  let { term } = req.query;
  term = term.toLowerCase();
  Image.findAll({ where: { imageCaption: { [Op.like]: `%${term}%` } } })
    .then(results => res.json({ results }))
    .catch(err => console.log(err));
};

exports.fetchOneImage = (req, res) => {
  Image.findOne({ where: { id: req.params.id } })
    .then(image => {
      if (!image)
        return res
          .status(404)
          .json({ success: false, msg: '!Image not found' });
      return res.json({ image });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.addImage = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // data ok
  const { imageCaption, imageUrl } = req.body;

  const surfer = req.user.id; // owner may be in token, check below
  const propertyId = req.params.id;
  let userMsg = '!Oops, you are not the property owner';
  let realOwner = null;

  // entry..
  const newImage = new Image({
    imageCaption,
    imageUrl,
    propertyId
  });

  /**
   * save already? no wait..
   * check if property exists */
  Property.findOne({ where: { id: propertyId } })
    .then(property => {
      if (!property) {
        return res
          .status(404)
          .json({ success: false, msg: '!Property not found' });
      }
      realOwner = property.owner;
      // CONTINUE..
      /**
       * save already? no wait..
       * check if user in token exists */
      User.findOne({ where: { id: surfer } }).then(user => {
        if (!user) {
          return res.status(400).json({
            success: false,
            msg: '!Cannot create image with nonexistent user'
          });
        }
        // CONTINUE..
        /**
         * save already? no wait..
         * check if user in token is owner */
        Property.findOne({
          where: { owner: surfer, id: propertyId }
        }).then(property => {
          if (property) {
            // owner can save
            userMsg = '!Property owner added image';
            // FINISH ..
            /**
             * save already? no wait..
             * to prevent double images by on same property, search best
             * field that would be unique-ish */
            Image.findOne({ where: { imageUrl, propertyId } }).then(item => {
              if (item)
                return res.status(400).json({
                  msg: '!Oops, this image is already listed',
                  realOwner,
                  surfer
                });
              /**
               * save already? YES!! */
              newImage.save().then(image => {
                return res.status(201).json({
                  success: true,
                  image,
                  msg: userMsg,
                  realOwner,
                  surfer
                });
              });
            });
          } else {
            // user is admin?
            User.findOne({ where: { id: surfer, isAdmin: true } }).then(
              user => {
                if (user) {
                  // admin may save
                  userMsg = '!Admin added image';
                  // FINISH ..
                  /**
                   * save already? no wait..
                   * to prevent double images by on same property, search best
                   * field that would be unique-ish */
                  Image.findOne({ where: { imageUrl, propertyId } }).then(
                    item => {
                      if (item)
                        return res.status(400).json({
                          msg: '!Oops, this image is already listed',
                          realOwner,
                          surfer
                        });
                      /**
                       * save already? YES!! */
                      newImage.save().then(image => {
                        return res.status(201).json({
                          success: true,
                          image,
                          msg: userMsg,
                          realOwner,
                          surfer
                        });
                      });
                    }
                  );
                } else {
                  // nobody else should
                  return res
                    .status(401)
                    .json({ success: false, msg: userMsg, realOwner, surfer });
                }
              }
            );
          }
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.deleteImage = (req, res) => {
  const surfer = req.user.id; // owner may be in token, check below
  const imageId = req.params.id;
  let userMsg = '!Oops, you are not the property image owner';
  let realOwner = null;

  /**
   * delete already? no wait..
   * check if image exists */
  Image.findOne({ where: { id: imageId } })
    .then(image => {
      if (!image) {
        return res
          .status(404)
          .json({ success: false, msg: '!Image not found' });
      }
      const { propertyId } = image;
      // CONTINUE..
      /**
       * delete already? no wait..
       * check if user in token exists */
      User.findOne({ where: { id: surfer } }).then(user => {
        if (!user) {
          return res.status(400).json({
            success: false,
            msg: '!Cannot delete image with nonexistent user'
          });
        }
        // CONTINUE..
        // determine owner helper
        Property.findOne({
          where: { id: propertyId }
        }).then(property => {
          realOwner = property.owner;
        });
        /**
         * delete already? no wait..
         * check if user in token is owner */
        Property.findOne({
          where: { owner: surfer, id: propertyId }
        }).then(property => {
          if (property) {
            // owner can save
            userMsg = '!Property owner deleted image';
            // FINISH ..
            /**
             * delete already? YES!! */
            Image.findOne({ where: { id: imageId } }).then(image => {
              if (image)
                return image
                  .destroy()
                  .then(() =>
                    res
                      .status(200)
                      .json({ success: true, msg: userMsg, realOwner, surfer })
                  );
            });
          } else {
            // user is admin?
            User.findOne({ where: { id: surfer, isAdmin: true } }).then(
              user => {
                if (user) {
                  // admin may save
                  userMsg = '!Admin deleted image';
                  // FINISH ..
                  /**
                   * delete already? YES!! */
                  Image.findOne({ where: { id: imageId } }).then(image => {
                    if (image)
                      return image.destroy().then(() =>
                        res.status(200).json({
                          success: true,
                          msg: userMsg,
                          realOwner,
                          surfer
                        })
                      );
                  });
                } else {
                  // nobody else should
                  return res
                    .status(401)
                    .json({ success: false, msg: userMsg, realOwner, surfer });
                }
              }
            );
          }
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

/**
 * VALIDATE IMAGE */
exports.validate = method => {
  switch (method) {
    case 'addImage': {
      return [
        check('imageCaption')
          .not()
          .isEmpty()
          .withMessage('imageCaption is required')
          .trim()
          .escape(),
        check('imageUrl')
          .not()
          .isEmpty()
          .withMessage('imageUrl is required')
          .isURL()
          .withMessage('invalid url')
      ];
    }

    default:
      return [];
  }
};
