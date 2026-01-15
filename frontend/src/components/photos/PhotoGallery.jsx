// src/components/photos/PhotoGallery.jsx
import { useState, useEffect } from 'react';
import { X, Trash2, Eye, Download, Loader, Camera, Link as LinkIcon, Unlink, Edit3 } from 'lucide-react';
import ObservationSelector from './ObservationSelector';
import { photoService } from '../../services/photoService';
import PhotoAnnotator from './PhotoAnnotator';
import toast from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const PhotoGallery = ({ inspectionId, onLinkToObservation }) => {
  const [photos, setPhotos] = useState([]);
  const [photoGroups, setPhotoGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
const [showObservationSelector, setShowObservationSelector] = useState(false);
const [showAnnotator, setShowAnnotator] = useState(false);
const [photoToAnnotate, setPhotoToAnnotate] = useState(null);

  
useEffect(() => {
  fetchPhotos();
}, [inspectionId]);
const fetchPhotos = async () => {
  try {
    setLoading(true);
    const response = await photoService.getByInspection(inspectionId);
    const photosData = response.data.photos || [];
    
    console.log('API Response:', response); 
    console.log('Photos data:', response.data.photos); 
    console.log('Fetched photos:', photosData); // Debug log
    
    setPhotos(photosData);

    // Group photos by tag_number (not photo_group)
    const grouped = photosData.reduce((acc, photo) => {
      const group = photo.tag_number || 'ungrouped'; // ✅ Changed from photo_group
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(photo);
      return acc;
    }, {});

    photosData.forEach(photo => {
      console.log('Photo:', photo.photo_id, 'Tag:', photo.tag_number); 
    });
    console.log('Grouped photos:', grouped); // Debug log

    setPhotoGroups(grouped);
  } catch (error) {
    console.error('Error fetching photos:', error);
    toast.error('Failed to load photos');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      await photoService.delete(photoId);
      toast.success('Photo deleted successfully');
      fetchPhotos();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete photo';
      toast.error(errorMsg);
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleLinkSelected = () => {
  if (selectedPhotos.length === 0) {
    toast.error('Please select at least one photo');
    return;
  }
  setShowObservationSelector(true);
};

const handleAnnotate = (photo) => {
  setPhotoToAnnotate(photo);
  setShowAnnotator(true);
};

const handleLinkToObservation = async (observationId) => {
  try {
    await photoService.linkToObservation(observationId, selectedPhotos);
    toast.success('Photos linked successfully');
    setSelectedPhotos([]);
    fetchPhotos(); // Refresh to show updated observation counts
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to link photos';
    toast.error(errorMsg);
  }
};

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
        <p className="text-neutral-600">Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
        <Camera className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
        <h4 className="text-lg font-semibold text-neutral-900 mb-2">No photos yet</h4>
        <p className="text-neutral-600">Upload photos to document your inspection findings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Actions */}
      {selectedPhotos.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedPhotos.length === photos.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPhotos(photos.map(p => p.photo_id));
                } else {
                  setSelectedPhotos([]);
                }
              }}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded"
            />
            <span className="text-sm font-medium text-primary-900">
              {selectedPhotos.length} photo(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLinkSelected}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Link to Observation
            </button>
            <button
              onClick={() => setSelectedPhotos([])}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Photo Groups */}
      {Object.keys(photoGroups).sort().map((groupKey) => (
        <div key={groupKey} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-accent-600">{groupKey}</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Photo {groupKey}
            </h3>
            <span className="text-sm text-neutral-500">
              ({photoGroups[groupKey].length} photo{photoGroups[groupKey].length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photoGroups[groupKey]
              .sort((a, b) => a.sequence_order - b.sequence_order)
              .map((photo) => (
                <div key={photo.photo_id} className="relative group">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.includes(photo.photo_id)}
                      onChange={() => togglePhotoSelection(photo.photo_id)}
                      className="w-5 h-5 text-primary-600 border-neutral-300 rounded shadow-sm"
                    />
                  </div>

                  {/* Photo */}
                  <img
  src={`http://localhost:5000${photo.file_uri}`} //  Add full URL
  alt={photo.original_filename}
  className="w-full h-48 object-cover rounded-lg border border-neutral-200 cursor-pointer"
  onClick={() => setSelectedPhoto(photo)}
/>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-all"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAnnotate(photo)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
                      title="Annotate Photo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(photo.photo_id)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Photo Number */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {groupKey}.{photo.sequence_order}
                  </div>

                  {/* Linked Observation Badge */}
                  {photo.observation_count > 0 && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Linked
                    </div>
                  )}

                  {/* Caption */}
                  {photo.caption && (
                    <p className="mt-2 text-xs text-neutral-600 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-neutral-100"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-5xl max-h-[90vh] overflow-auto">
            <img
  src={`http://localhost:5000${selectedPhoto.file_uri}`} // Add full URL
  alt={selectedPhoto.original_filename}
  className="w-full h-auto rounded-lg"
/>
            <div className="bg-white p-4 rounded-b-lg">
              <p className="font-medium text-neutral-900">
                Photo {selectedPhoto.photo_group}.{selectedPhoto.sequence_order}
              </p>
              {selectedPhoto.caption && (
                <p className="text-sm text-neutral-600 mt-1">{selectedPhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <ObservationSelector
  isOpen={showObservationSelector}
  onClose={() => setShowObservationSelector(false)}
  inspectionId={inspectionId}
  selectedPhotoIds={selectedPhotos}
  onLink={handleLinkToObservation}
/>

  <PhotoAnnotator
  isOpen={showAnnotator}
  onClose={() => {
    setShowAnnotator(false);
    setPhotoToAnnotate(null);
  }}
  photo={photoToAnnotate}
  onSave={() => {
    fetchPhotos(); // Refresh to show annotated version
  }}
/>
    </div>
  );
};

export default PhotoGallery;