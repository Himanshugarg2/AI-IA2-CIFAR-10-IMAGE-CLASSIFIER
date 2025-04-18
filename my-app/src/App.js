import { useState, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [modelType, setModelType] = useState("cifar");
  const [availableModels, setAvailableModels] = useState([]);

  // Fetch available models
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("http://localhost:8000/models");
        const data = await response.json();
        setAvailableModels(data);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    }
    fetchModels();
  }, []);

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
      const response = await fetch(`http://localhost:8000/predict?model_type=${modelType}`, {
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

  const categories = [
    "airplane", "automobile", "bird", "cat", "deer", 
    "dog", "frog", "horse", "ship", "truck"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-4 px-4 sm:py-8 md:py-12">
      {/* Header - Full Width */}
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-red-700 py-6 px-6 rounded-t-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">
          {modelType === "cifar" ? "CIFAR-10 Image Classifier" : "Multi-Object Detection"}
        </h1>
        <p className="text-red-100 text-center mt-2">
          {modelType === "cifar" 
            ? "Identify objects in your images with machine learning" 
            : "Detect multiple objects in a single image using YOLOv8"}
        </p>
      </div>
      
      {/* Model Selection */}
      <div className="max-w-6xl mx-auto bg-white shadow-lg py-4 px-6 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between">
          <div className="mb-2 sm:mb-0">
            <h2 className="text-lg font-semibold text-gray-700">Select Model:</h2>
          </div>
          <div className="flex space-x-4">
            {availableModels.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  setModelType(model.id);
                  setPrediction(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  modelType === model.id
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content - Full Width Desktop, Stack on Mobile */}
      <div className="max-w-6xl mx-auto bg-white shadow-xl">
        <div className="flex flex-col md:flex-row">
          {/* Upload Section - Full Height on Desktop */}
          <div className="md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-200">
            <div className={`border-2 h-full ${previewUrl ? 'border-red-400' : 'border-dashed border-gray-300'} rounded-xl p-4 md:p-8 text-center transition-all duration-300 hover:border-red-500 hover:shadow-md flex flex-col justify-between`}>
              {previewUrl ? (
                <div className="flex-grow flex items-center justify-center mb-4 relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-64 md:max-h-80 mx-auto rounded-lg object-contain shadow-md" 
                  />
                  {/* If YOLOv8 model and we have predictions, draw bounding boxes */}
                  {modelType === "yolo" && prediction && prediction.detections && (
                    <div className="absolute top-0 left-0 right-0 bottom-0">
                      {prediction.detections.map((detection, index) => {
                        // Calculate relative positions for the detections
                        // This is a simplified version - in real implementation you'd need to handle scaling
                        const imgElement = document.querySelector('img[alt="Preview"]');
                        const imgWidth = imgElement?.width || 300;
                        const imgHeight = imgElement?.height || 300;
                        
                        const [x1, y1, x2, y2] = detection.box;
                        const relX = (x1 / imgWidth) * 100;
                        const relY = (y1 / imgHeight) * 100;
                        const relWidth = ((x2 - x1) / imgWidth) * 100;
                        const relHeight = ((y2 - y1) / imgHeight) * 100;
                        
                        return (
                          <div 
                            key={index}
                            className="absolute border-2 border-red-500 flex items-start justify-start"
                            style={{
                              left: `${relX}%`,
                              top: `${relY}%`,
                              width: `${relWidth}%`,
                              height: `${relHeight}%`
                            }}
                          >
                            <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-sm">
                              {detection.class} ({Math.round(detection.confidence * 100)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 mb-6 py-8 md:py-16">
                  <svg className="h-20 w-20 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-xl mt-4 font-medium">Upload an image to classify</p>
                  <p className="text-sm text-gray-400 mt-2">Supports JPG, PNG, GIF up to 5MB</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <label className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer transition-all duration-150">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"></path>
                  </svg>
                  Select Image
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
                
                {previewUrl && (
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                      setPrediction(null);
                    }}
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-lg text-red-500 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 cursor-pointer transition-all duration-150"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="w-full mt-6 px-5 py-4 border border-transparent text-lg font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Image...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                  {modelType === "cifar" ? "Classify Image" : "Detect Objects"}
                </span>
              )}
            </button>
          </div>
          
          {/* Results Section - Side by Side on Desktop */}
          <div className="md:w-1/2 p-6 md:p-8 flex items-center">
            {prediction ? (
              modelType === "cifar" ? (
                // CIFAR-10 Results Display
                <div className="w-full bg-gradient-to-r from-red-50 to-red-50 border border-red-100 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-red-800 flex items-center mb-4">
                    <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Classification Result
                  </h2>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-red-100 rounded-full p-3 mr-3">
                          {prediction.class === "airplane" && (
                            <svg className="w-8 h-8 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                          {prediction.class === "automobile" && (
                            <svg className="w-8 h-8 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-8 5h8m-8 5h8" />
                            </svg>
                          )}
                          {prediction.class === "bird" && (
                            <svg className="w-8 h-8 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                          )}
                          {!["airplane", "automobile", "bird"].includes(prediction.class) && (
                            <svg className="w-8 h-8 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-red-900 capitalize">
                            {prediction.class}
                          </p>
                          <p className="text-sm text-red-600">
                            Identified Object
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center px-4 py-2 bg-red-600 rounded-full text-white font-semibold text-lg">
                          {(prediction.confidence * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          Confidence Score
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-red-200">
                    <div className="flex justify-between items-center flex-wrap mb-2">
                      <p className="text-sm text-gray-600 mb-2">CIFAR-10 Categories:</p>
                      <p className="text-xs text-red-600">Selected category is highlighted</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <span 
                          key={category}
                          className={`text-xs px-3 py-1.5 rounded-full ${prediction.class === category ? 'bg-red-600 text-white font-bold' : 'bg-gray-100 text-gray-600'} capitalize`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-red-200">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">About this classifier:</h3>
                    <p className="text-sm text-gray-600">
                      This classifier is trained on the CIFAR-10 dataset, which consists of 60,000 32x32 color images in 10 classes. 
                      It can identify common objects like vehicles, animals, and everyday items.
                    </p>
                  </div>
                </div>
              ) : (
                // YOLOv8 Results Display
                <div className="w-full bg-gradient-to-r from-red-50 to-red-50 border border-red-100 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-red-800 flex items-center mb-4">
                    <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Object Detection Results
                  </h2>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-bold text-red-900">
                          {prediction.count} {prediction.count === 1 ? "Object" : "Objects"}
                        </p>
                        <p className="text-sm text-red-600">
                          Detected in the image
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-4 border-t border-b border-red-200 mb-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Detected Objects:</h3>
                    
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                      {prediction.detections.map((detection, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                          <div className="flex items-center">
                            <div className="bg-red-100 rounded-full p-2 mr-3">
                              <svg className="w-6 h-6 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 capitalize">
                                {detection.class}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="inline-flex items-center px-2 py-1 bg-red-600 rounded-full text-white font-medium text-sm">
                              {(detection.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">About YOLOv8:</h3>
                    <p className="text-sm text-gray-600">
                      YOLOv8 is a state-of-the-art object detection model that can identify multiple objects in a single image.
                      It offers improved accuracy and performance over previous YOLO versions, supporting detection, segmentation and classification.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                {modelType === "cifar" ? "No classification yet" : "No objects detected yet"}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Upload an image and click the "{modelType === "cifar" ? "Classify Image" : "Detect Objects"}" button to see results.
                </p>
                <div className="mt-6">
                  {modelType === "cifar" ? (
                    <>
                      <h4 className="text-md font-semibold text-gray-700">CIFAR-10 Categories:</h4>
                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {categories.map(category => (
                          <span 
                            key={category}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-md font-semibold text-gray-700">YOLOv8 Capabilities:</h4>
                      <p className="mt-2 text-sm text-gray-500">
                        Detects 80+ common objects including people, vehicles, animals, and everyday items.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer - Full Width */}
      <div className="max-w-6xl mx-auto bg-white rounded-b-2xl shadow-lg border-t border-gray-200">
        <div className="py-4 px-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-600">
              Current Model: <span className="font-medium text-red-600">
                {modelType === "cifar" ? "CIFAR-10 Classifier" : "YOLOv8 Object Detector"}
              </span>
            </p>
          </div>
          <div className="flex space-x-6">
            <button className="text-sm font-medium flex items-center text-red-600 hover:text-red-800 transition-colors">
              <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {modelType === "cifar" ? "Classify Image" : "Detect Objects"}
            </button>
            <button className="text-sm text-gray-600 hover:text-red-600 transition-colors">
              About
            </button>
            <button className="text-sm text-gray-600 hover:text-red-600 transition-colors">
              Documentation
            </button>
            <button className="text-sm text-gray-600 hover:text-red-600 transition-colors">
              Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
