/**
 * Monitors image requests and handles screen size simulation
 * @param {string} screenSize - The screen size to simulate ('desktop', 'tablet', or 'phone')
 * @param {string} country - The country code for carbon calculations
 * @returns {Function} A function to stop the monitoring
 */
function monitorImageRequests(screenSize, country) {
  console.log(`Starting image monitoring with screen size: ${screenSize}, country: ${country}`);
  
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
  
  // Set up web request listener for images
  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  
  const imageRequestListener = (details) => {
    // Check if this is a completed request
    if (details.type === 'image') {
      console.log('Image request intercepted:', {
        url: details.url,
        size: details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-length')?.value || 'unknown',
        type: details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-type')?.value || 'unknown',
        country: country,
        screenSize: screenSize
      });
    }
    return { cancel: false };
  };
  
  // Add the listener
  chrome.webRequest.onResponseStarted.addListener(
    imageRequestListener,
    { urls: ["<all_urls>"], types: ["image"] },
    ["responseHeaders"]
  );
  
  // Return a function to stop monitoring
  return function stopMonitoring() {
    chrome.webRequest.onResponseStarted.removeListener(imageRequestListener);
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
