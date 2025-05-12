import PageLayout from '../components/PageLayout';

export default function ScanPage() {
  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Document Scanner</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Use your camera to scan and digitize documents
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="mb-8">
          <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-16 w-16 mx-auto text-slate-700"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <p className="mt-4 text-slate-400">
                Camera access is required for document scanning
              </p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                Enable Camera
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <h2 className="text-xl font-medium mb-4">Camera Controls</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="camera-source" className="block text-sm font-medium mb-1">
                  Camera Source
                </label>
                <select 
                  id="camera-source" 
                  className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900"
                >
                  <option value="environment">Rear Camera</option>
                  <option value="user">Front Camera</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="resolution" className="block text-sm font-medium mb-1">
                  Resolution
                </label>
                <select 
                  id="resolution" 
                  className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900"
                >
                  <option value="hd">HD (720p)</option>
                  <option value="fullhd">Full HD (1080p)</option>
                  <option value="4k">4K</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                Capture
              </button>
              
              <button className="flex-1 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
                Add Page
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-medium mb-4">Enhancement</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="brightness" className="block text-sm font-medium mb-1">
                  Brightness
                </label>
                <input 
                  id="brightness" 
                  type="range" 
                  min="0" 
                  max="200" 
                  defaultValue="100"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="contrast" className="block text-sm font-medium mb-1">
                  Contrast
                </label>
                <input 
                  id="contrast" 
                  type="range" 
                  min="0" 
                  max="200" 
                  defaultValue="100"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="sharpness" className="block text-sm font-medium mb-1">
                  Sharpness
                </label>
                <input 
                  id="sharpness" 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue="50"
                  className="w-full"
                />
              </div>
              
              <div className="pt-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm">
                    Auto detect edges
                  </span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm">
                    Perspective correction
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">Scanned Pages</h2>
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No pages scanned yet. Capture a document to get started.
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button className="py-2 px-4 bg-slate-300 text-slate-500 cursor-not-allowed rounded-md">
            Create PDF
          </button>
        </div>
      </div>
    </PageLayout>
  );
}