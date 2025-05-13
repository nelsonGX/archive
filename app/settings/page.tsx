import PageLayout from '../components/PageLayout';

export default function SettingsPage() {
  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Configure your Archive application preferences
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow">
        <div className="border-b border-zinc-200 dark:border-zinc-700">
          <nav className="flex">
            <button className="px-6 py-4 text-blue-600 border-b-2 border-blue-600 font-medium">
              General
            </button>
            <button className="px-6 py-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              Security
            </button>
            <button className="px-6 py-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              Google Drive
            </button>
            <button className="px-6 py-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              OCR
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          <div className="max-w-2xl">
            <div className="mb-8">
              <h2 className="text-xl font-medium mb-4">General Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium mb-1">
                    Language
                  </label>
                  <select 
                    id="language" 
                    className="w-full py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-900"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium mb-1">
                    Theme
                  </label>
                  <select 
                    id="theme" 
                    className="w-full py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-900"
                  >
                    <option value="system">System Default</option>
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Storage Usage
                  </label>
                  <div className="mt-1">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-500 mt-1">
                      <span>3.5 GB used</span>
                      <span>10 GB total</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-md font-medium">Default PDF Settings</h3>
                  
                  <div className="flex items-center">
                    <input 
                      id="auto-ocr" 
                      type="checkbox" 
                      className="h-4 w-4 border-zinc-300 rounded text-blue-600 focus:ring-blue-500"
                      defaultChecked 
                    />
                    <label htmlFor="auto-ocr" className="ml-2 text-sm">
                      Automatically run OCR on uploaded documents
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      id="auto-encrypt" 
                      type="checkbox" 
                      className="h-4 w-4 border-zinc-300 rounded text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <label htmlFor="auto-encrypt" className="ml-2 text-sm">
                      Encrypt all uploaded documents
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      id="auto-backup" 
                      type="checkbox" 
                      className="h-4 w-4 border-zinc-300 rounded text-blue-600 focus:ring-blue-500" 
                    />
                    <label htmlFor="auto-backup" className="ml-2 text-sm">
                      Automatically backup to Google Drive
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button className="py-2 px-4 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                Reset to Defaults
              </button>
              <button className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}