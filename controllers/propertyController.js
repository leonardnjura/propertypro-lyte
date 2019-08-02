const { check, validationResult } = require('express-validator');

const Sequelize = require('sequelize');
const { User, Property, Image, Flag } = require('../models/index');

const { Op } = Sequelize;

/**
 * REST */
exports.fetchAllProperties = (req, res) => {
  Property.belongsTo(User, { foreignKey: 'owner' });
  Property.hasMany(Image, { foreignKey: 'propertyId' });
  Property.hasMany(Flag, { foreignKey: 'propertyId' });

  const queRRi = {};
  let pageNo = 1;
  let pageSize = 10;
  let totalCount = null;
  let totalPages = null;
  queRRi.include = [User, Image, Flag];
  queRRi.order = [['updatedAt', 'DESC']];
  const cols = ['id', 'updatedAt', 'price', 'type', 'city', 'state'];

  if (req.query.include) {
    const include = parseInt(req.query.include, 10);
    if (include === 0) queRRi.include = [];
  }

  if (req.query.orderBy) {
    const { orderBy } = req.query;
    if (cols.includes(orderBy)) {
      queRRi.order = [[orderBy, 'ASC']];
    }
  }

  if (req.query.pageNo) {
    const userPageNo = parseInt(req.query.pageNo, 10);
    if (userPageNo < 0 || userPageNo === 0)
      return res
        .status(400)
        .json({ msg: '!Invalid page number, should start with 1' });
    pageNo = userPageNo;
  }

  if (req.query.pageSize) {
    const userPageSize = parseInt(req.query.pageSize, 10);
    if (userPageSize < 0 || userPageSize === 0)
      return res
        .status(400)
        .json({ msg: '!Invalid page size, should start with 1' });
    pageSize = userPageSize;
  }

  if (pageNo) {
    queRRi.offset = pageSize * (pageNo - 1);
    queRRi.limit = pageSize;
  }
  queRRi.where = {};

  Property.count()
    .then(count => {
      totalCount = count;
      totalPages = Math.ceil(totalCount / pageSize);
    })
    .catch(err => console.log(err));

  Property.findAll(queRRi)
    .then(properties => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const nextPage = pageNo + 1;
      let nextPageLink = `${fullUrl
        .split('?')
        .shift()}?pageNo=${nextPage}&pageSize=${pageSize}`;
      if (nextPage > totalPages) {
        nextPageLink = null;
      }
      return res.status(200).json({
        properties,
        count: totalCount,
        countPerPage: pageSize,
        totalPages,
        nextPageLink
      });
    })
    .catch(err => console.log(err));
};

exports.searchAllProperties = (req, res) => {
  let { term } = req.query;
  term = term.toLowerCase();
  Property.findAll({ where: { type: { [Op.like]: `%${term}%` } } })
    .then(results => res.json({ results }))
    .catch(err => console.log(err));
};

exports.fetchOneProperty = (req, res) => {
  Property.belongsTo(User, { foreignKey: 'owner' });
  Property.hasMany(Image, { foreignKey: 'propertyId' });
  Property.hasMany(Flag, { foreignKey: 'propertyId' });
  Property.findOne({
    where: { id: req.params.id },
    include: [User, Image, Flag]
  })
    .then(property => {
      if (!property) {
        // property object is always there but object may be null
        return res
          .status(404)
          .json({ success: false, msg: '!Property not found' });
      }
      return res.json({ property });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.addProperty = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const { price, state, city, address, type, imageUrl } = req.body;
  const owner = req.user.id; // owner in token
  const status = 'available'; // default

  User.findOne({ where: { id: owner } })
    .then(user => {
      if (!user)
        return res
          .status(400)
          .json({ msg: '!Cannot create property with nonexistent user' });

      // all ok
      // NB: add description later in Flag model
      const newProperty = new Property({
        price,
        state,
        city,
        address,
        type,
        imageUrl,
        owner,
        status
      });

      /**
       * save already? no wait..
       * to prevent double listing of property by same person, search best
       * field that would be unique-ish */
      Property.findOne({ where: { imageUrl, owner } }).then(item => {
        if (item)
          return res.status(400).json({
            msg: '!Oops, this property is already listed'
          });

        newProperty.save().then(property => {
          res.status(201).json({ success: true, property });
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.updatePropertyStatus = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { status } = req.body;

  Property.findOne({ where: { id: req.params.id } })
    .then(property => {
      if (!property) {
        return res
          .status(404)
          .json({ success: false, msg: '!Property not found' });
      }

      /**
       * update already? no wait..
       * only property owner (or admin) to finish this */
      let userMsg = '!Oops, you are not the property owner';
      const realOwner = property.owner;
      const surfer = req.user.id;

      Property.findOne({
        where: { owner: surfer, id: req.params.id }
      }).then(property => {
        if (property) {
          userMsg = '!Property owner updated status';
          // owner can save
          return property
            .update({ status })
            .then(() =>
              res.status(200).json({ property, success: true, msg: userMsg })
            );
        }
        User.findOne({ where: { id: surfer, isAdmin: true } }).then(user => {
          if (user) {
            userMsg = '!Admin updated status';
            // admin may save too
            Property.findOne({
              where: { id: req.params.id }
            }).then(property => {
              return property
                .update({ status })
                .then(() =>
                  res
                    .status(200)
                    .json({ property, success: true, msg: userMsg })
                );
            });
          } else {
            // nobody else should save
            return res
              .status(401)
              .json({ success: false, msg: userMsg, realOwner, surfer });
          }
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.updatePropertyInfo = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { price, state, city, address, type, imageUrl, status } = req.body;

  Property.findOne({ where: { id: req.params.id } })
    .then(property => {
      if (!property) {
        return res
          .status(404)
          .json({ success: false, msg: '!Property not found' });
      }

      /**
       * update already? no wait..
       * only property owner (or admin) to finish this */
      let userMsg = '!Oops, you are not the property owner';
      const realOwner = property.owner;
      const surfer = req.user.id;

      Property.findOne({
        where: { owner: surfer, id: req.params.id }
      }).then(property => {
        if (property) {
          userMsg = '!Property owner updated info';
          // owner can save
          return property
            .update({ price, state, city, address, type, imageUrl, status })
            .then(() =>
              res.status(200).json({ property, success: true, msg: userMsg })
            );
        }
        User.findOne({ where: { id: surfer, isAdmin: true } }).then(user => {
          if (user) {
            userMsg = '!Admin updated info';
            // admin may save too
            Property.findOne({
              where: { id: req.params.id }
            }).then(property => {
              return property
                .update({
                  price,
                  state,
                  city,
                  address,
                  type,
                  imageUrl,
                  status
                })
                .then(() =>
                  res
                    .status(200)
                    .json({ property, success: true, msg: userMsg })
                );
            });
          } else {
            // nobody else should save
            return res
              .status(401)
              .json({ success: false, msg: userMsg, realOwner, surfer });
          }
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.deleteProperty = (req, res) => {
  const id = parseInt(req.params.id, 10);
  Property.findOne({ where: { id } })
    .then(property => {
      if (!property) {
        return res
          .status(404)
          .json({ success: false, msg: '!Property not found', id });
      }

      /**
       * delete already? no wait..
       * only property owner (or admin) to finish this */
      let userMsg = '!Oops, you are not the property owner';
      const realOwner = property.owner;
      const surfer = req.user.id;

      Property.findOne({
        where: { owner: surfer, id: req.params.id }
      }).then(property => {
        if (property) {
          userMsg = `!Property owner deleted property with ID: ${id}`;
          // owner can expunge
          return property
            .destroy()
            .then(() =>
              res
                .status(200)
                .json({ success: true, msg: userMsg, realOwner, surfer })
            );
        }
        User.findOne({ where: { id: surfer, isAdmin: true } }).then(user => {
          if (user) {
            userMsg = `!Admin deleted property with ID: ${id}`;
            // admin may expunge too
            Property.findOne({
              where: { id: req.params.id }
            }).then(property => {
              return property
                .destroy()
                .then(() =>
                  res
                    .status(200)
                    .json({ success: true, msg: userMsg, realOwner, surfer })
                );
            });
          } else {
            // nobody else should expunge
            return res
              .status(401)
              .json({ success: false, msg: userMsg, realOwner, surfer });
          }
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

/**
 * VALIDATE PROPERTY */
exports.validate = method => {
  switch (method) {
    case 'addProperty': {
      return [
        check('price')
          .not()
          .isEmpty()
          .withMessage('price is required')
          .isFloat()
          .withMessage('must be a float or double precision number'),
        check('state')
          .not()
          .isEmpty()
          .withMessage('state is required')
          .trim()
          .escape(),
        check('city')
          .not()
          .isEmpty()
          .withMessage('city is required')
          .trim()
          .escape(),
        check('address')
          .not()
          .isEmpty()
          .withMessage('address is required')
          .trim()
          .escape(),
        check('type')
          .not()
          .isEmpty()
          .withMessage('type is required')
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

    case 'updatePropertyStatus': {
      return [
        check('status')
          .not()
          .isEmpty()
          .withMessage('status is required')
          .isIn(['sold', 'available'])
          .withMessage('status must be either sold or available')
      ];
    }

    case 'updatePropertyInfo': {
      return [
        check('price')
          .optional()
          .isFloat()
          .withMessage('must be a float or double precision number'),
        check('state')
          .optional()
          .trim()
          .escape(),
        check('city')
          .optional()
          .trim()
          .escape(),
        check('address')
          .optional()
          .trim()
          .escape(),
        check('type')
          .optional()
          .trim()
          .escape(),
        check('imageUrl')
          .optional()
          .isURL()
          .withMessage('invalid url'),
        check('status')
          .optional()
          .isIn(['sold', 'available'])
          .withMessage('status must be either sold or available')
      ];
    }

    default:
      return [];
  }
};
