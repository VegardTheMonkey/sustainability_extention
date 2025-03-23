console.log("Sustainability Dashboard content script loaded");

// Screen size presets (in pixels)
const SCREEN_SIZES = {
  desktop: 1920,
  tablet: 768,
  phone: 375
};

/**
 * Simulates a different screen width by applying CSS media query overrides
 * @param {string} screenSize - The screen size to simulate ('desktop', 'tablet', or 'phone')
 */
function simulateScreenWidth(screenSize) {
  console.log(`Simulating screen width for: ${screenSize}`);
  
  // Get the width in pixels based on the screen size
  const width = SCREEN_SIZES[screenSize] || SCREEN_SIZES.desktop;
  
  // Remove any existing simulation elements
  const existingSimulation = document.getElementById('sustainability-dashboard-simulation');
  if (existingSimulation) {
    existingSimulation.remove();
  }
  
  // Remove any existing style overrides
  const existingStyles = document.getElementById('sustainability-dashboard-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  
  // If we're simulating desktop, we don't need to add any constraints
  if (screenSize === 'desktop') {
    console.log('Using native desktop width, no simulation needed');
    return;
  }
  
  // Create a floating indicator to show the current simulation mode
  const indicator = document.createElement('div');
  indicator.id = 'sustainability-dashboard-simulation';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background-color: rgba(76, 175, 80, 0.8);
    color: white;
    padding: 8px 15px;
    border-radius: 4px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  const infoText = document.createElement('span');
  infoText.textContent = `Simulating ${screenSize} view (${width}px)`;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-left: 10px;
  `;
  closeButton.onclick = () => {
    indicator.remove();
    if (existingStyles) {
      existingStyles.remove();
    }
  };
  
  indicator.appendChild(infoText);
  indicator.appendChild(closeButton);
  
  // Add CSS to limit the viewport width
  const styleElement = document.createElement('style');
  styleElement.id = 'sustainability-dashboard-styles';
  styleElement.textContent = `
    /* Add a max-width to the body */
    body {
      max-width: ${width}px !important;
      margin-left: auto !important;
      margin-right: auto !important;
      overflow-x: hidden !important;
    }
    
    /* Add a background color to show the constrained width */
    html {
      background-color: #f0f0f0 !important;
    }
    
    /* Force media queries to apply */
    html:before {
      content: '';
      display: none;
    }
    
    @media (max-width: ${width}px) {
      html:before {
        content: '';
        display: none;
      }
    }
  `;
  
  // Add elements to the document
  document.head.appendChild(styleElement);
  document.body.appendChild(indicator);
  
  console.log(`Screen width simulation applied: ${screenSize} (${width}px)`);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'simulateWidth') {
    try {
      simulateScreenWidth(message.screenSize);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error simulating screen width:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'logImageData') {
    console.log('Image request intercepted:', message.imageData);
    // Add detailed logging of the image properties
    console.log(`URL: ${message.imageData.url}`);
    console.log(`Size: ${message.imageData.size} bytes`);
    console.log(`Type: ${message.imageData.type}`);
    console.log(`Screen Size: ${message.imageData.screenSize}`);
    
    // Send response back to confirm receipt
    sendResponse({ received: true });
    return true; // Keep the message channel open for async response
  }
});

// Log that the content script has loaded
console.log('Sustainability Dashboard content script ready to simulate screen sizes');