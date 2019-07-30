const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const Sequelize = require('sequelize');
const { generateToken } = require('../middleware/auth');
const { User } = require('../models/index');

const { Op } = Sequelize;

/**
 * REST */
exports.fetchAllUsers = (req, res) => {
  User.findAll({ limit: 100, order: [['updatedAt', 'DESC']] })
    .then(users => res.status(200).json({ users }))
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
  User.findOne({ where: { id } })
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
        res.json({ token, user });
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.updateUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
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
          return res.status(401).json({ msg: userMsg, surfer });
        }
      });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
};

exports.promoteUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
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
              .then(() => res.json({ success: true, msg: userMsg, surfer }));
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
