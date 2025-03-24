// Store analysis data for Sustainability Dashboard
console.log("Store Analysis module loaded");

// Storage for collected image data
const imageDataStore = {
  images: [],
  isAnalyzing: false
};

// Initialize from storage
chrome.storage.local.get(['analyzeImages', 'storedImageData'], (result) => {
  imageDataStore.isAnalyzing = result.analyzeImages || false;
  imageDataStore.images = result.storedImageData || [];
  console.log(`Store analysis initialized with ${imageDataStore.images.length} stored images`);
});

/**
 * Handles incoming image data from content script
 * @param {Object} imageData - Data about the intercepted image
 */
function storeImageData(imageData) {
  if (!imageDataStore.isAnalyzing) return;
  
  // Add timestamp to the data
  const enhancedData = {
    ...imageData,
    timestamp: Date.now()
  };
  
  // Store the image data
  imageDataStore.images.push(enhancedData);
  console.log(`Stored new image data, total images: ${imageDataStore.images.length}`);
  
  // Save to persistent storage
  chrome.storage.local.set({ storedImageData: imageDataStore.images });
  
  // Send to popup if it's open
  sendDataToPopup(enhancedData);
}

/**
 * Sends the image data to popup if it's open
 * @param {Object} imageData - Single image data or null to send all
 */
function sendDataToPopup(imageData = null) {
  chrome.runtime.sendMessage({
    action: 'imageDataCollected',
    imageData: imageData,
    allImageData: imageData ? null : imageDataStore.images
  }).catch(error => {
    // This is expected if the popup isn't open
    if (!error.message.includes("Could not establish connection")) {
      console.error("Error sending to popup:", error);
    }
  });
}

/**
 * Clears stored image data
 */
function clearImageData() {
  imageDataStore.images = [];
  chrome.storage.local.set({ storedImageData: [] });
  console.log("Cleared stored image data");
}

/**
 * Updates the analyzing state
 * @param {boolean} isAnalyzing - Whether we're analyzing or not
 */
function setAnalyzingState(isAnalyzing) {
  imageDataStore.isAnalyzing = isAnalyzing;
  console.log(`Analysis state set to: ${isAnalyzing}`);
  
  // If we've stopped analyzing, we might want to finalize the data
  if (!isAnalyzing) {
    // Optional: do any final processing here
    console.log(`Analysis completed with ${imageDataStore.images.length} images collected`);
  }
}

// Export functions for background.js to use
self.storeAnalysis = {
  storeImageData,
  sendDataToPopup,
  clearImageData,
  setAnalyzingState,
  getAllData: () => imageDataStore.images
};
