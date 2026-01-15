// src/components/photos/PhotoUpload.jsx
import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, Trash2, Link as LinkIcon } from 'lucide-react';
import { photoService } from '../../services/photoService';
import toast from 'react-hot-toast';

const PhotoUpload = ({ inspectionId, observationId = null, photoGroup, onSuccess, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        toast.error(`${file.name} is not an image file`);
      }
      return isImage;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024).toFixed(2) // KB
    }));

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index].preview);
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    setUploading(true);

    try {
      await photoService.upload(inspectionId, selectedFiles, photoGroup, observationId);
      toast.success(`${selectedFiles.length} photo(s) uploaded successfully`);
      
      // Clean up previews
      previews.forEach(p => URL.revokeObjectURL(p.preview));
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to upload photos';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
      >
        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-neutral-700 mb-1">
          Click to upload photos
        </p>
        <p className="text-xs text-neutral-500">
          PNG, JPG, JPEG up to 10MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-700">
              Selected Photos ({previews.length})
            </h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Add More
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.preview}
                  alt={preview.name}
                  className="w-full h-32 object-cover rounded-lg border border-neutral-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={uploading}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-neutral-600 truncate">{preview.name}</p>
                  <p className="text-xs text-neutral-400">{preview.size} KB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Photo Group {photoGroup}</p>
          <p className="text-xs mt-1">
            These photos will be numbered as {photoGroup}.1, {photoGroup}.2, etc.
            {observationId && ' and linked to the selected observation'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
        <button
          onClick={onClose}
          disabled={uploading}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="btn-primary px-4 py-2 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PhotoUpload;