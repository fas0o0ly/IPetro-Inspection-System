// backend/src/routes/photoRoutes.js

const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// All routes require authentication
router.use(authenticate);

// Upload photos (accepts multiple files with field name 'photos')
router.post('/upload', upload.array('photos', 20), photoController.uploadPhotos);

// Get photos by inspection
router.get('/inspection/:inspectionId', photoController.getPhotosByInspection);

router.post('/:id/annotations', photoController.saveAnnotations);

// Get photo groups for inspection
router.get('/inspection/:inspectionId/groups', photoController.getPhotoGroups);

// Get photos by observation
router.get('/observation/:observationId', photoController.getPhotosByObservation);

// Get single photo by ID
router.get('/:id', photoController.getPhotoById);

// Update photo metadata (caption, component, etc.)
router.put('/:id', photoController.updatePhoto);

// Link photos to observation
router.post('/link-observation', photoController.linkPhotosToObservation);

// Unlink photo from observation
router.delete('/unlink-observation/:observationId/:photoId', photoController.unlinkPhotoFromObservation);

// Bulk delete photos
router.post('/bulk-delete', photoController.bulkDeletePhotos);

// Delete single photo
router.delete('/:id', photoController.deletePhoto);




module.exports = router;