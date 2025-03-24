// Simple image data receiver for Sustainability Dashboard
console.log("Image Receiver loaded");

// Create a namespace for the image receiver functions
window.imageReceiver = (function() {
  // Array to store image data
  let collectedImages = [];
  
  // Function to get the collected images
  function getCollectedImages() {
    return collectedImages;
  }
  
  // Add function to clear collected data
  function clearCollectedData() {
    chrome.runtime.sendMessage({
      action: 'clearCollectedImageData'
    });
    collectedImages = [];
    console.log('Cleared local image data');
  }
  
  // Return public methods
  return {
    getCollectedImages: getCollectedImages,
    clearCollectedData: clearCollectedData
  };
})();

// Request all stored image data when popup opens
document.addEventListener('DOMContentLoaded', () => {
  // Connect to the background script to notify it's open
  const port = chrome.runtime.connect({name: "popup"});
  
  // Request all collected data
  chrome.runtime.sendMessage({
    action: 'getCollectedImageData'
  });
});

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'imageDataCollected') {
    console.log('Popup received image data from service worker');
    
    // If we received a single image
    if (message.imageData) {
      console.log('New image data:', message.imageData);
      window.imageReceiver.getCollectedImages().push(message.imageData);
      logImageDetails(message.imageData);
    }
    
    // If we received all images
    if (message.allImageData) {
      console.log(`Received ${message.allImageData.length} stored images`);
      // Replace the internal array
      window.imageReceiver.getCollectedImages().length = 0;
      message.allImageData.forEach(img => {
        window.imageReceiver.getCollectedImages().push(img);
      });
      
      // Process all images
      message.allImageData.forEach(imgData => {
        logImageDetails(imgData);
      });
    }
    
    // Dispatch an event to notify displayImages.js that data has been updated
    document.dispatchEvent(new CustomEvent('imageDataUpdated'));
    
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

/**
 * Log detailed information about the received image data
 * @param {Object} imageData - The image data to log
 */
function logImageDetails(imageData) {
  console.group('Image Details');
  console.log('URL:', imageData.url);
  console.log('Size:', imageData.size, 'bytes');
  console.log('Type:', imageData.type);
  console.log('Screen Size:', imageData.screenSize);
  
  if (imageData.elementInfo) {
    console.group('Element Info');
    console.log('Tag:', imageData.elementInfo.tagName);
    console.log('Dimensions:', imageData.elementInfo.width, 'x', imageData.elementInfo.height);
    console.log('Visible:', imageData.elementInfo.isVisible);
    console.log('Classes:', imageData.elementInfo.classList);
    console.groupEnd();
  }
  
  if (imageData.timestamp) {
    console.log('Timestamp:', new Date(imageData.timestamp).toLocaleString());
  }
  
  console.groupEnd();
}
