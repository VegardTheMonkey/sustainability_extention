// Define the extension state object
const extensionState = {
  analyzeImages: false,
  selectedCountry: 'GLOBAL',
  screenSize: 'desktop' // Default screen size
};

// Initialize state from storage
chrome.storage.local.get(['analyzeImages', 'selectedCountry', 'screenSize'], (result) => {
  if (result.analyzeImages !== undefined) {
    extensionState.analyzeImages = result.analyzeImages;
  }
  if (result.selectedCountry !== undefined) {
    extensionState.selectedCountry = result.selectedCountry;
  }
  if (result.screenSize !== undefined) {
    extensionState.screenSize = result.screenSize;
  }
  console.log('State initialized from storage:', extensionState);
});

/**
 * @param {Object} message - The message to send
 */
function safelySendMessage(message) {
  try {
    chrome.runtime.sendMessage(message, response => {
      // Handle the potential error from sendMessage
      if (chrome.runtime.lastError) {
        // Just log it but don't throw - this prevents the uncaught error
        console.log('Message sending produced an error: ', chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    console.log('Error sending message: ', error);
  }
}

/**
 * Sets the analyzeImages flag
 * @param {boolean} value - true when analysis is active, false when not
 */
function setAnalyzeImagesFlag(value) {
  extensionState.analyzeImages = value;
  // Update local storage
  chrome.storage.local.set({ analyzeImages: value });
  // Send message for background script to listen to
  safelySendMessage({
    type: 'stateChange',
    flag: 'analyzeImages',
    value: value
  });
  console.log(`analyzeImages flag set to: ${value}`);
}

/**
 * Sets the selected country for carbon intensity calculation
 * @param {string} countryCode - The country code selected by the user
 */
function setSelectedCountry(countryCode) {
  extensionState.selectedCountry = countryCode;
  // Update local storage
  chrome.storage.local.set({ selectedCountry: countryCode });
  // Send message for background script to listen to
  safelySendMessage({
    type: 'stateChange',
    flag: 'selectedCountry',
    value: countryCode
  });
  console.log(`selectedCountry set to: ${countryCode}`);
}

/**
 * Sets the selected screen size
 * @param {string} size - The screen size (desktop, tablet, or phone)
 */
function setScreenSize(size) {
  extensionState.screenSize = size;
  // Update local storage
  chrome.storage.local.set({ screenSize: size });
  // Send message for background script to listen to
  safelySendMessage({
    type: 'stateChange',
    flag: 'screenSize',
    value: size
  });
  console.log(`screenSize set to: ${size}`);
}

/**
 * Gets the current state of all flags
 * @returns {Object} The current extension state
 */
function getExtensionState() {
  return {...extensionState};
}

// Export functions for use in other scripts
window.flagSetter = {
  setAnalyzeImagesFlag,
  setSelectedCountry,
  setScreenSize,
  getExtensionState
};
