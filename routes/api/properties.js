const express = require('express');

const router = express.Router();

const { auth } = require('../../middleware/auth');
const propertyController = require('../../controllers/propertyController');

// @route   GET api/properties
// @desc    Fetch all properties
// @access  Public
router.get('/', propertyController.fetchAllProperties);

// @route   GET api/properties/:id
// @desc    Fetch one property
// @access  Public
router.get('/:id', propertyController.fetchOneProperty);

// @route   POST api/properties
// @desc    Register a property
// @access  Protected
router.post(
  '/',
  auth,
  propertyController.validate('addProperty'),
  propertyController.addProperty
);

// @route   PATCH api/properties/:id/sold
// @desc    Sets property status as sold( or available)
// @access  Protected, owner
router.patch(
  '/:id/sold',
  auth,
  propertyController.validate('updatePropertyStatus'),
  propertyController.updatePropertyStatus
);

// @route   PUT api/properties/:id
// @desc    Edits property info
// @access  Protected, owner
router.put(
  '/:id',
  auth,
  propertyController.validate('updatePropertyInfo'),
  propertyController.updatePropertyInfo
);

// @route   DELETE api/properties/:id
// @desc    Delete a property
// @access  Protected, owner
router.delete('/:id', auth, propertyController.deleteProperty);

module.exports = router;
