// src/pages/photos/PhotoList.jsx
const PhotoList = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Photos</h1>
          <p className="text-neutral-600 mt-1">Inspection photos gallery</p>
        </div>
        <button className="btn-primary">
          Upload Photos
        </button>
      </div>

      <div className="bg-white rounded-xl p-12 border border-neutral-200 text-center">
        <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">📸</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Photo Management
        </h3>
        <p className="text-neutral-600 mb-4">
          Upload and manage inspection photos
        </p>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-800">
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default PhotoList;