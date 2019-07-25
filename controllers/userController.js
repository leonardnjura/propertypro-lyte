const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const { generateToken } = require('../middleware/auth');
const { User } = require('../models/index');

// REST
exports.fetchAllUsers = (req, res) => {
  User.findAll({ limit: 100, order: [['updatedAt', 'DESC']] })
    .then(users => res.status(200).json(users))
    .catch(err => console.log(err));
};

exports.fetchOneUser = (req, res) => {
  User.findOne({ where: { id: req.params.id } })
    .then(user => {
      if (!user) {
        // user object is always there but object may be null
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return res.json({ user });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.createUser = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
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
            res.status(201).json({ token, user });
          });
        });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.updateUser = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { firstName, lastName } = req.body;

  User.findOne({ where: { id: req.params.id } })
    .then(user => {
      if (!user) {
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return user.update({ firstName, lastName }).then(() =>
        res.json({
          user: {
            // avoid pswd / annoying yada yada display
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

exports.promoteUser = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  const { isAdmin } = req.body;

  User.findOne({ where: { id: req.params.id } })
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
  User.findOne({ where: { id: req.params.id } })
    .then(user => {
      if (!user) {
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return user.destroy().then(() => res.json({ success: true }));
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

// VALIDATE
exports.validate = method => {
  switch (method) {
    case 'createUser': {
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
        //   .isInt()
        //   .withMessage('must be an integer')
        //   .isIn(['0000', '1000', '1100', '1300', '1700', '1900'])
        //   .withMessage('must contain cool numbers')
      ];
    }

    case 'updateUser': {
      return [
        check('firstName')
          .not()
          .isEmpty()
          .withMessage('firstname is required')
          .isLength({ min: 3 })
          .withMessage('must be at least 3 chars long')
          .trim()
          .escape(),
        check('lastName')
          .not()
          .isEmpty()
          .withMessage('lastname is required')
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
          .withMessage('isadmin is required')
          .isBoolean()
          .withMessage('must be a boolean')
      ];
    }

    default:
      return [];
  }
};
