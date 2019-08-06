const express = require('express');

const router = express.Router();

const { auth } = require('../../middleware/auth');
const propertyController = require('../../controllers/propertyController');
const flagController = require('../../controllers/flagController');
const imageController = require('../../controllers/imageController');

// @route   GET api/properties
// @desc    Fetch all properties
// @access  Public
router.get('/', propertyController.fetchAllProperties);

// @route   GET api/properties/search?term=type
// @desc    Search all properties
// @access  Public
router.get('/search', propertyController.searchAllProperties);

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

/**
 * IMAGES C:
 * after a property is listed, the owner may bind to it
 * pictures of it.. views, elevations and room tours
 * NB: SEE STANDALONE ROUTE FOR RUD of CRUD ON THESE
 */

// @route   POST api/properties/:id/images
// @desc    Sets property pictures (more..)
// @access  Protected, owner
router.post(
  '/:id/images',
  auth,
  imageController.validate('addImage'),
  imageController.addImage
);

/**
 * FLAGS C:
 * after a property is listed, the owner may bind to it
 * flags of it and reasons for its pricing.. the public is free
 * to fling demands and complaints at the property
 * NB: SEE STANDALONE ROUTE FOR RUD of CRUD ON THESE
 */

// @route   POST api/properties/:id/flags
// @desc    Sets property flags (reasons: pricing, location, etc)
// @access  Public & Protected, owner
router.post(
  '/:id/flags',
  auth,
  flagController.validate('addFlag'),
  flagController.addFlag
);

module.exports = router;
