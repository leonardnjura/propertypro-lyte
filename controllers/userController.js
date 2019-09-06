const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const moment = require('moment');

const Sequelize = require('sequelize');
const { generateToken } = require('../middleware/auth');
const { User, Property } = require('../models/index');

const { Op } = Sequelize;
User.hasMany(Property, { foreignKey: 'owner' });

/**
 * REST */
exports.fetchAllUsers = (req, res) => {
  const queRRi = {};
  let pageNo = 1;
  let pageSize = 10;
  let totalCount = null;
  let totalPages = null;
  queRRi.include = [Property];
  queRRi.order = [['updatedAt', 'DESC']];
  const cols = [
    'id',
    'updatedAt',
    'createdAt',
    'email',
    'firstName',
    'lastName'
  ];

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

  User.count()
    .then(count => {
      totalCount = count;
      totalPages = Math.ceil(totalCount / pageSize);
    })
    .catch(err => console.log(err));

  User.findAll(queRRi)
    .then(users => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const nextPage = pageNo + 1;
      let nextPageLink = `${fullUrl
        .split('?')
        .shift()}?pageNo=${nextPage}&pageSize=${pageSize}`;
      if (nextPage > totalPages) {
        nextPageLink = null;
      }
      res.status(200).json({
        users,
        count: totalCount,
        countPerPage: pageSize,
        totalPages,
        nextPageLink
      });
    })
    .catch(err => console.log(err));
};

exports.searchAllUsers = (req, res) => {
  let { term } = req.query;
  term = term.toLowerCase();
  User.findAll({ where: { email: { [Op.like]: `%${term}%` } } })
    .then(results => res.json({ results }))
    .catch(err => console.log(err));
};

exports.fetchOneUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  User.findOne({ where: { id }, include: [Property] })
    .then(user => {
      if (!user) {
        // user object is always there but object may be null
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return res.json({ user });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.addUser = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password } = req.body;

  User.findOne({ where: { email } })
    .then(user => {
      if (user) return res.status(400).json({ msg: '!User already exists' });

      // all ok
      const newUser = new User({
        firstName,
        lastName,
        email,
        password
      });

      // salt & hash
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save().then(user => {
            const token = generateToken(user);
            // signup saa..
            const today = moment()
              .local()
              .format('dddd');
            const now = moment()
              .local()
              .format('Do MMMM, YYYY hh:mma');
            const time = `${today} ${now};`;
            res.status(201).json({ token, time, user });
          });
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;
  // custom validation, :)
  if (!email || !password) {
    return res
      .status(400)
      .json({ msg: '!Please login with email and password' });
  }
  User.findOne({ where: { email } })
    .then(user => {
      // existing user?
      if (!user) return res.status(400).json({ msg: '!User does not exist' });

      // validate password..
      bcrypt.compare(password, user.password).then(isMatch => {
        if (!isMatch)
          return res.status(400).json({ msg: '!Invalid credentials' });
        const token = generateToken(user);
        // login saa..
        const today = moment().format('dddd');
        const now = moment().format('Do MMMM, YYYY hh:mma');
        const time = `${today} ${now};`;
        res.json({ token, time, user });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.updateUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { firstName, lastName } = req.body;

  User.findOne({ where: { id } })
    .then(user => {
      if (!user) {
        return res.status(404).json({ success: false, msg: '!User not found' });
      }

      /**
       * update already? no wait..
       * only account owner (or admin) to finish this */
      const surfer = req.user.id;
      const realOwner = user.id;
      let userMsg = '!Oops, you are not the account owner';

      if (surfer === id) {
        userMsg = '!Account owner updated profile';
        // owner can save
        return user
          .update({ firstName, lastName })
          .then(() => res.json({ user, success: true, msg: userMsg, surfer }));
      }
      User.findOne({ where: { id: surfer, isAdmin: true } }).then(admin => {
        if (admin) {
          User.findOne({ where: { id } }).then(user => {
            userMsg = '!Admin updated profile';
            // admin may save
            return user
              .update({ firstName, lastName })
              .then(() =>
                res.json({ user, success: true, msg: userMsg, surfer })
              );
          });
        } else {
          // decline otherwise, nobody else should save
          return res.status(401).json({ msg: userMsg, realOwner, surfer });
        }
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.promoteUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { isAdmin } = req.body;

  User.findOne({ where: { id } })
    .then(user => {
      if (!user) {
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return user.update({ isAdmin }).then(() =>
        res.json({
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
            updatedAt: user.updatedAt
          },
          success: true
        })
      );
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.deleteUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  User.findOne({ where: { id } })
    .then(user => {
      if (!user) {
        return res.status(404).json({ success: false, msg: '!User not found' });
      }

      /**
       * delete already? no wait..
       * only account owner (or admin) to finish this */
      const surfer = req.user.id;
      const realOwner = user.id;
      let userMsg = '!Oops, you are not the account owner';

      if (surfer === id) {
        userMsg = `!Account owner deleted account with ID: ${id}`;
        // owner can save
        return user
          .destroy()
          .then(() => res.json({ success: true, msg: userMsg, surfer }));
      }
      User.findOne({ where: { id: surfer, isAdmin: true } }).then(admin => {
        if (admin) {
          User.findOne({ where: { id } }).then(user => {
            userMsg = `!Admin deleted account with ID: ${id}`;
            // admin may save
            return user
              .destroy()
              .then(() =>
                res.json({ success: true, msg: userMsg, realOwner, surfer })
              );
          });
        } else {
          // decline otherwise, nobody else should save
          return res.status(401).json({ msg: userMsg, surfer });
        }
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

/**
 * VALIDATE USER */
exports.validate = method => {
  switch (method) {
    case 'addUser': {
      return [
        check('firstName')
          .optional()
          .trim()
          .escape(),
        check('lastName')
          .optional()
          .trim()
          .escape(),
        check('email')
          .not()
          .isEmpty()
          .withMessage('email is required')
          .isEmail()
          .withMessage('valid email is required')
          .trim()
          .escape()
          .normalizeEmail(),
        check('password', '')
          .not()
          .isEmpty()
          .withMessage('password is required')
          .isLength({ min: 4 })
          .withMessage('must be at least 4 chars long')
          .matches(/\d/)
          .withMessage('must contain a number')
      ];
    }

    case 'updateUser': {
      return [
        check('firstName')
          .not()
          .isEmpty()
          .withMessage('firstName is required')
          .isLength({ min: 3 })
          .withMessage('must be at least 3 chars long')
          .trim()
          .escape(),
        check('lastName')
          .not()
          .isEmpty()
          .withMessage('lastName is required')
          .isLength({ min: 3 })
          .withMessage('must be at least 3 chars long')
          .trim()
          .escape()
      ];
    }

    case 'promoteUser': {
      return [
        check('isAdmin')
          .not()
          .isEmpty()
          .withMessage('isAdmin is required')
          .isBoolean()
          .withMessage('must be a boolean')
      ];
    }

    default:
      return [];
  }
};
