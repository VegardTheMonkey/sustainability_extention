// Load the CO2.js library using importScripts
self.importScripts('./co2.js');

// Load the webrequest-chrome.js library using importScripts
self.importScripts('./webrequest-chrome.js');

// Load the storeAnalysis.js module
self.importScripts('./storeAnalasis.js');
storeAnalysis.clearImageData();

// Creating an instance of the CO₂ calculator with options
const co2Calculator = new co2.co2();

// Extension state tracking
const extensionState = {
  analyzeImages: false,
  selectedCountry: 'GLOBAL',
  screenSize: 'desktop'
};

// Initialize storage with default values if not already set
chrome.storage.local.get(['analyzeImages', 'selectedCountry', 'screenSize'], (result) => {
  if (!result.analyzeImages) {
    chrome.storage.local.set({ analyzeImages: false });
  }
  if (!result.selectedCountry) {
    chrome.storage.local.set({ selectedCountry: 'GLOBAL' });
  }
  if (!result.screenSize) {
    chrome.storage.local.set({ screenSize: 'desktop' });
  }
});

// Variable to hold the stop monitoring function
let stopImageMonitoring = null;

// Message listener for state changes from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'stateChange') {
    console.log(`Background received state change: ${message.flag} = ${message.value}`);
    
    // Update our local state and storage
    if (message.flag === 'analyzeImages') {
      extensionState.analyzeImages = message.value;
      chrome.storage.local.set({ analyzeImages: message.value });
      
      // Update the store analysis module state
      storeAnalysis.setAnalyzingState(message.value);
      
      if (message.value === true) {
        console.log('Analysis mode activated - beginning image scanning');
        // Start monitoring image requests with current screen size and country settings
        if (imageMonitor && typeof imageMonitor.monitorImageRequests === 'function') {
          stopImageMonitoring = imageMonitor.monitorImageRequests(
            extensionState.screenSize,
            extensionState.selectedCountry
          );
        }
      } else {
        console.log('Analysis mode deactivated');
        // Stop monitoring if we were doing so
        if (stopImageMonitoring && typeof stopImageMonitoring === 'function') {
          stopImageMonitoring();
          stopImageMonitoring = null;
        }
      }
    } 
    else if (message.flag === 'selectedCountry') {
      extensionState.selectedCountry = message.value;
      chrome.storage.local.set({ selectedCountry: message.value });
      console.log(`Carbon intensity calculations will use: ${message.value}`);
    } 
    else if (message.flag === 'screenSize') {
      extensionState.screenSize = message.value;
      chrome.storage.local.set({ screenSize: message.value });
      console.log(`Screen size for calculations set to: ${message.value}`);
    }

    // Send a response to confirm receipt
    sendResponse({ success: true });
    return true; // Keeps the message channel open for async response
  }
  
  // Handle image data coming from content script
  if (message.action === 'logImageData') {
    console.log('Service worker received image data from content script');
    // Store the image data in our analysis module
    storeAnalysis.storeImageData(message.imageData);
    sendResponse({ success: true });
    return true;
  }
  
  // Handle request from popup for all collected data
  if (message.action === 'getCollectedImageData') {
    console.log('Popup requested all collected image data');
    storeAnalysis.sendDataToPopup();
    sendResponse({ success: true });
    return true;
  }
  
  // Handle request to clear data
  if (message.action === 'clearCollectedImageData') {
    console.log('Received request to clear collected image data');
    storeAnalysis.clearImageData();
    sendResponse({ success: true });
    return true;
  }
});

// Listen for popup window opening to send collected data
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    console.log('Popup opened, sending collected data');
    port.onDisconnect.addListener(() => {
      console.log('Popup closed');
    });
    
    // Small delay to ensure popup is ready to receive
    setTimeout(() => {
      storeAnalysis.sendDataToPopup();
    }, 100);
  }
});

// Log available countries (if the library exposes countryIntensity).
if (typeof co2.averageIntensity !== "undefined" && co2.averageIntensity.data) {
  console.log("Available countries for CO₂ calculation:");
  for (const [code, value] of Object.entries(co2.averageIntensity.data)) {
    if (code !== "WORLD") {
      console.log(`${code}: ${value} gCO2/kWh`);
    }
  }
} else {
  console.warn("Country intensity data is not available in the loaded library.");
}

// Test CO₂ calculation with 1MB of data.
const testBytes = 1000000; // 1MB
console.log("\nTesting CO₂ calculations with 1MB of data:");

// Global average CO₂ emission calculation
const globalEmissions = co2Calculator.perByte(testBytes, false);
console.log(`Global average: ${globalEmissions}g CO2`);

// Example calculations for specific countries
const countryCalculations = {
  USA: co2Calculator.perByteTrace(testBytes, false, {
    gridIntensity: {
      device: { country: 'USA' },
      network: { country: 'USA' },
      dataCenter: { country: 'USA' }
    }
  }),
  GBR: co2Calculator.perByteTrace(testBytes, false, {
    gridIntensity: {
      device: { country: 'GBR' },
      network: { country: 'GBR' },
      dataCenter: { country: 'GBR' }
    }
  }),
  NOR: co2Calculator.perByteTrace(testBytes, false, {
    gridIntensity: {
      device: { country: 'NOR' },
      network: { country: 'NOR' },
      dataCenter: { country: 'NOR' }
    }
  })
};

// Log country-specific calculations
for (const [country, result] of Object.entries(countryCalculations)) {
  console.log(`${country}: ${result.co2}g CO2`);
}

// Listen for web navigation events to track page loads
self.addEventListener('fetch', event => {
  console.log('Fetch event intercepted:', event.request.url);
});

// Log that the service worker has started
console.log('Sustainability Dashboard service worker initialized');