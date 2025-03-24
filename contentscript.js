console.log("Sustainability Dashboard content script loaded");

// Screen size presets (in pixels)
const SCREEN_SIZES = {
  desktop: 1920,
  tablet: 768,
  phone: 375
};

/**
 * Auto-scrolls through the page to help view the entire content
 */
function autoScrollPage() {
  console.log('Starting auto-scroll through page');
  
  // Calculate the total scroll height
  const scrollHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  ) - window.innerHeight;
  
  // Create scroll parameters
  const duration = 10000; // 10 seconds total
  const stepDelay = 50; // 50ms between steps
  const steps = duration / stepDelay;
  const scrollStep = scrollHeight / steps;
  
  let currentStep = 0;
  let scrollInterval = setInterval(() => {
    currentStep++;
    
    // Calculate current scroll position
    const scrollPosition = currentStep * scrollStep;
    
    // Scroll to the new position
    window.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
    
    // Check if we've reached the end
    if (currentStep >= steps || scrollPosition >= scrollHeight) {
      clearInterval(scrollInterval);
      console.log('Auto-scroll completed');
    }
  }, stepDelay);
}

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
      autoScrollPage();
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
    if(message.imageData.url){
      // Use the findElementByImageUrl function directly since it's included in the content scripts
      const imageElement = findElementByImageUrl(message.imageData.url);
      
      // Store the element in the imageData for later use
      if (imageElement) {
        message.imageData.element = imageElement;
        console.log('Image element found:', imageElement);
        
        // You can also add more information about the element
        message.imageData.elementInfo = {
          tagName: imageElement.tagName,
          width: imageElement.width || imageElement.offsetWidth,
          height: imageElement.height || imageElement.offsetHeight,
          isVisible: imageElement.offsetWidth > 0 && imageElement.offsetHeight > 0,
          classList: Array.from(imageElement.classList),
          altText: imageElement.alt || ''
        };
        console.log('Image element info:', message.imageData.elementInfo);
      } else {
        console.log('Image element not found for URL:', message.imageData.url);
      }
    }
    console.log(`Size: ${message.imageData.size} bytes`);
    console.log(`Type: ${message.imageData.type}`);
    console.log(`Screen Size: ${message.imageData.screenSize}`);
    
    // Send the data to the service worker instead of directly to the popup
    chrome.runtime.sendMessage({
      action: 'logImageData',
      imageData: {
        url: message.imageData.url,
        size: message.imageData.size,
        type: message.imageData.type,
        screenSize: message.imageData.screenSize,
        elementInfo: message.imageData.elementInfo
      }
    });
    
    // Send response back to confirm receipt
    sendResponse({ received: true });
    return true; // Keep the message channel open for async response
  }
});

// Log that the content script has loaded
console.log('Sustainability Dashboard content script ready to simulate screen sizes');