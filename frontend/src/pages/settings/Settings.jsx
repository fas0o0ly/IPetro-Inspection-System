// src/pages/settings/Settings.jsx
const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600 mt-1">System configuration</p>
      </div>

      <div className="bg-white rounded-xl p-12 border border-neutral-200 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">⚙️</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          System Settings
        </h3>
        <p className="text-neutral-600 mb-4">
          Configure system preferences and options
        </p>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-200 text-neutral-800">
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default Settings;