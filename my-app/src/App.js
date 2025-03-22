import { useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    
    // Create a preview URL for the image
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-800">CIFAR-10 Image Classifier</h1>
          </div>
          
          <div className="mt-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              {previewUrl ? (
                <div className="mb-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-40 mx-auto rounded-md object-contain"
                  />
                </div>
              ) : (
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p>Upload an image to classify</p>
                </div>
              )}
              
              <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                Select Image
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="w-full mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Classify Image"
              )}
            </button>
          </div>
          
          {prediction && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800">Result</h2>
              <div className="mt-2 flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {prediction.class}
                  </p>
                  <p className="text-sm text-gray-500">
                    Classification
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-gray-900">
                    {(prediction.confidence * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    Confidence
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Powered by CIFAR-10 Image Classification API</p>
      </div>
    </div>
  );
}