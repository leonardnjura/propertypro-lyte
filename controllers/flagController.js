const { check, validationResult } = require('express-validator');

const Sequelize = require('sequelize');
const { User, Property, Flag } = require('../models/index');

const { Op } = Sequelize;

/**
 * REST */
exports.fetchAllFlags = (req, res) => {
  Flag.findAll({ limit: 100, order: [['updatedAt', 'DESC']] }).then(flags =>
    res.status(200).json({ flags })
  );
};

exports.searchAllFlags = (req, res) => {
  let { term } = req.query;
  term = term.toLowerCase();
  Flag.findAll({ where: { description: { [Op.like]: `%${term}%` } } }).then(
    results => res.json({ results })
  );
};

exports.fetchOneFlag = (req, res) => {
  Flag.findOne({ where: { id: req.params.id } })
    .then(flag => {
      if (!flag)
        return res.status(404).json({ success: false, msg: '!Flag not found' });
      return res.json({ flag });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.addFlag = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // data ok
  const { reason, description } = req.body;

  const surfer = req.user.id; // owner may be in token, check below
  const propertyId = req.params.id;
  let userMsg = '!Oops, you are not the property owner';
  let realOwner = null;

  // entry..
  const newFlag = new Flag({
    reason,
    description,
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
            msg: '!Cannot create flag with nonexistent user'
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
            userMsg = '!Property owner added flag';
            // FINISH ..
            /**
             * save already? no wait..
             * to prevent double flags by on same property, search best
             * field that would be unique-ish */
            Flag.findOne({ where: { description, propertyId } }).then(item => {
              if (item)
                return res.status(400).json({
                  msg: '!Oops, this flag is already up',
                  realOwner,
                  surfer
                });
              /**
               * save already? YES!! */
              newFlag.save().then(flag => {
                return res.status(201).json({
                  success: true,
                  flag,
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
                  userMsg = '!Admin added flag';
                  // FINISH ..
                  /**
                   * save already? no wait..
                   * to prevent double flags by on same property, search best
                   * field that would be unique-ish */
                  Flag.findOne({ where: { description, propertyId } }).then(
                    item => {
                      if (item)
                        return res.status(400).json({
                          msg: '!Oops, this flag is already up',
                          realOwner,
                          surfer
                        });
                      /**
                       * save already? YES!! */
                      newFlag.save().then(flag => {
                        return res.status(201).json({
                          success: true,
                          flag,
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

exports.deleteFlag = (req, res) => {
  const surfer = req.user.id; // owner may be in token, check below
  const flagId = req.params.id;
  let userMsg = '!Oops, you are not the property flag owner';
  let realOwner = null;

  /**
   * delete already? no wait..
   * check if flag exists */
  Flag.findOne({ where: { id: flagId } })
    .then(flag => {
      if (!flag) {
        return res.status(404).json({ success: false, msg: '!Flag not found' });
      }
      const { propertyId } = flag;
      // CONTINUE..
      /**
       * delete already? no wait..
       * check if user in token exists */
      User.findOne({ where: { id: surfer } }).then(user => {
        if (!user) {
          return res.status(400).json({
            success: false,
            msg: '!Cannot delete flag with nonexistent user'
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
            userMsg = '!Property owner deleted flag';
            // FINISH ..
            /**
             * delete already? YES!! */
            Flag.findOne({ where: { id: flagId } }).then(flag => {
              if (flag)
                return flag
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
                  userMsg = '!Admin deleted flag';
                  // FINISH ..
                  /**
                   * delete already? YES!! */
                  Flag.findOne({ where: { id: flagId } }).then(flag => {
                    if (flag)
                      return flag.destroy().then(() =>
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
 * VALIDATE FLAG */
exports.validate = method => {
  switch (method) {
    case 'addFlag': {
      return [
        check('reason')
          .not()
          .isEmpty()
          .withMessage('reason is required')
          .trim()
          .escape(),
        check('description')
          .not()
          .isEmpty()
          .withMessage('description is required')
          .isLength({ min: 10 })
          .withMessage('must be at least 10 chars long')
          .trim()
          .escape()
      ];
    }

    default:
      return [];
  }
};
