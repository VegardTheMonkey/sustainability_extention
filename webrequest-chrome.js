/**
 * Monitors image requests and handles screen size simulation
 * @param {string} screenSize - The screen size to simulate ('desktop', 'tablet', or 'phone')
 * @returns {Function} A function to stop the monitoring
 */
function monitorImageRequests(screenSize) {
  console.log(`Starting image monitoring with screen size: ${screenSize}`);
  
  // Send message to content script to simulate screen width
  const simulateScreenSize = () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'simulateWidth',
          screenSize: screenSize
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Error sending message to content script:', chrome.runtime.lastError);
          } else if (response && response.success) {
            console.log('Screen size simulation applied successfully');
          }
        });
      }
    });
  };
  
  // Run simulation immediately
  simulateScreenSize();
  
  // Listen for tab updates to reapply screen size after page loads/reloads
  const tabUpdateListener = (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      console.log('Tab finished loading, reapplying screen size simulation');
      setTimeout(simulateScreenSize, 100); // Small delay to ensure content script is ready
    }
  };
  
  // Add the tab update listener
  chrome.tabs.onUpdated.addListener(tabUpdateListener);
  
  // Set up web request listener for images
  const imageRequestListener = (details) => {
    // Check if this is a completed request
    if (details.type === 'image') {
      // Get content length header, with fallback for when it's missing
      let contentLength = 'unknown';
      const contentLengthHeader = details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-length');
      if (contentLengthHeader && contentLengthHeader.value) {
        contentLength = contentLengthHeader.value;
      }
      
      const imageData = {
        url: details.url,
        size: contentLength,
        type: details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-type')?.value || 'unknown',
        screenSize: screenSize
      };
      
      // Only log if we actually have a size (optional)
      if (contentLength !== 'unknown') {
        // Send image data to content script for logging
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'logImageData',
              imageData: imageData
            }, (response) => {
              // Add error handling for message sending
              if (chrome.runtime.lastError) {
                console.log('Error sending image data to content script:', chrome.runtime.lastError);
              } else if (response) {
                console.log('Image data sent to content script successfully');
              }
            });
          }
        });
      } else {
        console.log(`Image detected but size unknown: ${details.url}`);
      }
    }
    return { cancel: false };
  };
  
  // Add the listener
  chrome.webRequest.onCompleted.addListener(
    imageRequestListener,
    { urls: ["<all_urls>"], types: ["image"] },
    ["responseHeaders"]
  );
  
  // Return a function to stop monitoring
  return function stopMonitoring() {
    chrome.webRequest.onCompleted.removeListener(imageRequestListener);
    chrome.tabs.onUpdated.removeListener(tabUpdateListener);
    console.log('Image monitoring stopped');
  };
}

// Export the function for use in background.js
if (typeof module !== 'undefined') {
  module.exports = { monitorImageRequests };
} else {
  // For service worker context
  self.imageMonitor = { monitorImageRequests };
}
