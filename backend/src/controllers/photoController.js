// backend/src/controllers/photoController.js

const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const { burnAnnotations } = require('../utils/imageProcessor');


// When returning photo data, encode the filename
const getPhotoUrl = (filename) => {
  // Encode spaces and special characters
  const encodedFilename = encodeURIComponent(filename);
  return `/uploads/photos/${encodedFilename}`;
};

// Upload photos
exports.uploadPhotos = async (req, res, next) => {
  try {
    const { inspection_id, tag_number, observation_id, component, component_category } = req.body;
    const uploaded_by = req.user.user_id;

    // Validation
    if (!inspection_id || !tag_number) {
      return errorResponse(res, 'Inspection ID and photo group (tag_number) are required', 400);
    }

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No photos uploaded', 400);
    }

    // Verify inspection exists
    const inspectionCheck = await db.query(
      'SELECT inspection_id FROM inspections WHERE inspection_id = $1',
      [inspection_id]
    );

    if (inspectionCheck.rowCount === 0) {
      // Delete uploaded files if inspection doesn't exist
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return errorResponse(res, 'Inspection not found', 404);
    }

    // Get next sequence number for this photo group (tag_number)
    const sequenceResult = await db.query(
      'SELECT COALESCE(MAX(sequence_no), 0) + 1 as next_sequence FROM photos WHERE inspection_id = $1 AND tag_number = $2',
      [inspection_id, tag_number]
    );
    let nextSequence = sequenceResult.rows[0].next_sequence;

    // Insert photos into database
    const uploadedPhotos = [];
    
    for (const file of req.files) {
      const result = await db.query(
        `INSERT INTO photos (
          inspection_id, 
          uploaded_by, 
          sequence_no, 
          file_size, 
          component_category, 
          mime_type, 
          original_filename, 
          name, 
          file_uri, 
          tag_number, 
          component, 
          caption, 
          uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          inspection_id,
          uploaded_by,
          nextSequence,
          file.size,
          component_category || null,
          file.mimetype,
          file.originalname,
          file.filename,
          `/uploads/photos/${file.filename}`,
          tag_number,
          component || null,
          req.body.caption || null
        ]
      );

      const photo = {
        ...result.rows[0],
        file_url: getPhotoUrl(result.rows[0].name) // ✅ ADDED: Encoded URL
      };
      uploadedPhotos.push(photo);

      // If observation_id provided, link photo to observation
      if (observation_id) {
        await db.query(
          `INSERT INTO observation_photos (observation_id, photo_id, sequence_order, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (observation_id, photo_id) DO NOTHING`,
          [observation_id, photo.photo_id, nextSequence]
        );
      }

      nextSequence++;
    }

    // logger.success('Photos uploaded', { 
    //   count: uploadedPhotos.length, 
    //   inspectionId: inspection_id,
    //   tagNumber: tag_number
    // });

    return successResponse(
      res,
      { photos: uploadedPhotos },
      `${uploadedPhotos.length} photo(s) uploaded successfully`,
      201
    );

  } catch (err) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    //logger.error('Upload photos error:', err);
    next(err);
  }
};

// Get photos by inspection
exports.getPhotosByInspection = async (req, res, next) => {
  try {
    const { inspectionId } = req.params;

    const result = await db.query(
      `SELECT 
        p.*,
        u.name as uploader_name,
        u.email as uploader_email,
        COUNT(DISTINCT op.observation_id) as observation_count
       FROM photos p
       LEFT JOIN users u ON p.uploaded_by = u.user_id
       LEFT JOIN observation_photos op ON p.photo_id = op.photo_id
       WHERE p.inspection_id = $1
       GROUP BY p.photo_id, u.name, u.email
       ORDER BY p.tag_number, p.sequence_no`,
      [inspectionId]
    );

    // ✅ ADDED: Encode URLs before sending
    const photos = result.rows.map(photo => ({
      ...photo,
      file_url: getPhotoUrl(photo.name)
    }));

    return successResponse(
      res,
      { photos: photos }, // ✅ CHANGED: Use encoded photos
      'Photos retrieved successfully'
    );

  } catch (err) {
    logger.error('Get photos by inspection error:', err);
    next(err);
  }
};

// Get photos by observation
exports.getPhotosByObservation = async (req, res, next) => {
  try {
    const { observationId } = req.params;

    const result = await db.query(
      `SELECT 
        p.*,
        u.name as uploader_name,
        u.email as uploader_email,
        op.sequence_order
       FROM photos p
       INNER JOIN observation_photos op ON p.photo_id = op.photo_id
       LEFT JOIN users u ON p.uploaded_by = u.user_id
       WHERE op.observation_id = $1
       ORDER BY op.sequence_order, p.sequence_no`,
      [observationId]
    );

    // ✅ ADDED: Encode URLs before sending
    const photos = result.rows.map(photo => ({
      ...photo,
      file_url: getPhotoUrl(photo.name)
    }));

    return successResponse(
      res,
      { photos: photos }, // ✅ CHANGED: Use encoded photos
      'Photos retrieved successfully'
    );

  } catch (err) {
    logger.error('Get photos by observation error:', err);
    next(err);
  }
};

// Get photo groups for inspection
exports.getPhotoGroups = async (req, res, next) => {
  try {
    const { inspectionId } = req.params;

    const result = await db.query(
      `SELECT 
        tag_number as photo_group,
        COUNT(*) as photo_count,
        MAX(uploaded_at) as last_upload,
        MIN(sequence_no) as min_sequence,
        MAX(sequence_no) as max_sequence
       FROM photos
       WHERE inspection_id = $1
       GROUP BY tag_number
       ORDER BY tag_number`,
      [inspectionId]
    );

    return successResponse(
      res,
      { groups: result.rows },
      'Photo groups retrieved successfully'
    );

  } catch (err) {
    logger.error('Get photo groups error:', err);
    next(err);
  }
};

// Get single photo by ID
exports.getPhotoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        p.*,
        u.name as uploader_name,
        u.email as uploader_email,
        COUNT(DISTINCT op.observation_id) as observation_count
       FROM photos p
       LEFT JOIN users u ON p.uploaded_by = u.user_id
       LEFT JOIN observation_photos op ON p.photo_id = op.photo_id
       WHERE p.photo_id = $1
       GROUP BY p.photo_id, u.name, u.email`,
      [id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Photo not found', 404);
    }

    // ✅ ADDED: Encode URL before sending
    const photo = {
      ...result.rows[0],
      file_url: getPhotoUrl(result.rows[0].name)
    };

    return successResponse(
      res,
      { photo: photo }, // ✅ CHANGED: Use encoded photo
      'Photo retrieved successfully'
    );

  } catch (err) {
    logger.error('Get photo by ID error:', err);
    next(err);
  }
};

// Update photo metadata
exports.updatePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caption, component, component_category } = req.body;

    // Check if photo exists
    const photoCheck = await db.query(
      'SELECT * FROM photos WHERE photo_id = $1',
      [id]
    );

    if (photoCheck.rowCount === 0) {
      return errorResponse(res, 'Photo not found', 404);
    }

    const photo = photoCheck.rows[0];

    // Check permission
    if (photo.uploaded_by !== req.user.user_id && req.user.role !== 'admin') {
      return errorResponse(res, 'You do not have permission to update this photo', 403);
    }

    // Update photo
    const result = await db.query(
      `UPDATE photos 
       SET caption = COALESCE($1, caption),
           component = COALESCE($2, component),
           component_category = COALESCE($3, component_category)
       WHERE photo_id = $4
       RETURNING *`,
      [caption, component, component_category, id]
    );

    logger.success('Photo updated', { photoId: id });

    // ✅ ADDED: Encode URL before sending
    const updatedPhoto = {
      ...result.rows[0],
      file_url: getPhotoUrl(result.rows[0].name)
    };

    return successResponse(
      res,
      { photo: updatedPhoto }, // ✅ CHANGED: Use encoded photo
      'Photo updated successfully'
    );

  } catch (err) {
    logger.error('Update photo error:', err);
    next(err);
  }
};

// Delete photo
exports.deletePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get photo info before deleting
    const photoResult = await db.query(
      'SELECT * FROM photos WHERE photo_id = $1',
      [id]
    );

    if (photoResult.rowCount === 0) {
      return errorResponse(res, 'Photo not found', 404);
    }

    const photo = photoResult.rows[0];

    // Check permission - only uploader or admin can delete
    if (photo.uploaded_by !== req.user.user_id && req.user.role !== 'admin') {
      return errorResponse(res, 'You do not have permission to delete this photo', 403);
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads/photos', photo.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database (CASCADE will handle observation_photos)
    await db.query('DELETE FROM photos WHERE photo_id = $1', [id]);

    //logger.success('Photo deleted', { photoId: id });

    return successResponse(
      res,
      { photo },
      'Photo deleted successfully'
    );

  } catch (err) {
    //logger.error('Delete photo error:', err);
    next(err);
  }
};

// Link photos to observation
exports.linkPhotosToObservation = async (req, res, next) => {
  try {
    const { observation_id, photo_ids } = req.body;

    // Validation
    if (!observation_id || !photo_ids || !Array.isArray(photo_ids) || photo_ids.length === 0) {
      return errorResponse(res, 'Observation ID and photo IDs array are required', 400);
    }

    // Verify observation exists
    const obsCheck = await db.query(
      'SELECT observation_id FROM observations WHERE observation_id = $1',
      [observation_id]
    );

    if (obsCheck.rowCount === 0) {
      return errorResponse(res, 'Observation not found', 404);
    }

    // Link each photo
    const linked = [];
    let sequenceOrder = 1;

    for (const photoId of photo_ids) {
      // Verify photo exists
      const photoCheck = await db.query(
        'SELECT photo_id FROM photos WHERE photo_id = $1',
        [photoId]
      );

      if (photoCheck.rowCount === 0) {
        continue; // Skip invalid photo IDs
      }

      // Check if already linked
      const existingLink = await db.query(
        'SELECT * FROM observation_photos WHERE observation_id = $1 AND photo_id = $2',
        [observation_id, photoId]
      );

      if (existingLink.rowCount === 0) {
        await db.query(
          `INSERT INTO observation_photos (observation_id, photo_id, sequence_order, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [observation_id, photoId, sequenceOrder]
        );
        linked.push(photoId);
      }
      sequenceOrder++;
    }

    // logger.success('Photos linked to observation', { 
    //   observationId: observation_id, 
    //   photoCount: linked.length 
    // });

    return successResponse(
      res,
      { linked_count: linked.length, photo_ids: linked },
      `${linked.length} photo(s) linked to observation successfully`
    );

  } catch (err) {
    //logger.error('Link photos to observation error:', err);
    next(err);
  }
};

// Unlink photo from observation
exports.unlinkPhotoFromObservation = async (req, res, next) => {
  try {
    const { observationId, photoId } = req.params;

    const result = await db.query(
      'DELETE FROM observation_photos WHERE observation_id = $1 AND photo_id = $2 RETURNING *',
      [observationId, photoId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Photo link not found', 404);
    }

    //logger.success('Photo unlinked from observation', { observationId, photoId });

    return successResponse(
      res,
      { link: result.rows[0] },
      'Photo unlinked from observation successfully'
    );

  } catch (err) {
    //logger.error('Unlink photo from observation error:', err);
    next(err);
  }
};

// Bulk delete photos
exports.bulkDeletePhotos = async (req, res, next) => {
  try {
    const { photo_ids } = req.body;

    if (!photo_ids || !Array.isArray(photo_ids) || photo_ids.length === 0) {
      return errorResponse(res, 'Photo IDs array is required', 400);
    }

    // Get photos info
    const photosResult = await db.query(
      'SELECT * FROM photos WHERE photo_id = ANY($1)',
      [photo_ids]
    );

    const photos = photosResult.rows;

    // Check permissions for each photo
    for (const photo of photos) {
      if (photo.uploaded_by !== req.user.user_id && req.user.role !== 'admin') {
        return errorResponse(res, `You do not have permission to delete photo ${photo.photo_id}`, 403);
      }
    }

    // Delete files from filesystem
    photos.forEach(photo => {
      const filePath = path.join(__dirname, '../../uploads/photos', photo.name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Delete from database
    await db.query('DELETE FROM photos WHERE photo_id = ANY($1)', [photo_ids]);

    logger.success('Photos bulk deleted', { count: photos.length });

    return successResponse(
      res,
      { deleted_count: photos.length },
      `${photos.length} photo(s) deleted successfully`
    );

  } catch (err) {
    logger.error('Bulk delete photos error:', err);
    next(err);
  }
};

exports.saveAnnotations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { annotations } = req.body;

    console.log('Received annotation request for photo:', id);
    console.log('Annotations count:', annotations?.length);

    if (!annotations || !Array.isArray(annotations)) {
      return errorResponse(res, 'Annotations array is required', 400);
    }

    if (annotations.length === 0) {
      return errorResponse(res, 'No annotations to save', 400);
    }

    // Get photo info
    const photoResult = await db.query(
      'SELECT * FROM photos WHERE photo_id = $1',
      [id]
    );

    if (photoResult.rowCount === 0) {
      return errorResponse(res, 'Photo not found', 404);
    }

    const photo = photoResult.rows[0];

    // Check permission
    if (photo.uploaded_by !== req.user.user_id && req.user.role !== 'admin') {
      return errorResponse(res, 'You do not have permission to annotate this photo', 403);
    }

    // Get full file path
    const filePath = path.join(__dirname, '../../uploads/photos', photo.name);

    if (!fs.existsSync(filePath)) {
      console.error('Photo file not found:', filePath);
      return errorResponse(res, 'Photo file not found on server', 404);
    }

    console.log('Burning annotations onto:', filePath);

    // Burn annotations onto image
    await burnAnnotations(filePath, annotations);

    // Update database to mark as annotated
    await db.query(
      'UPDATE photos SET has_annotations = true WHERE photo_id = $1',
      [id]
    );

    console.log('✓ Annotations saved to photo:', id);

    return successResponse(
      res,
      { photo_id: id, annotations_count: annotations.length },
      'Annotations saved successfully'
    );

  } catch (err) {
    console.error('✗ Save annotations error:', err);
    next(err);
  }
};