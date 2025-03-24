// Display Images Module for Sustainability Dashboard
console.log("Display Images module loaded");

// Module for displaying image data in different formats
window.displayImages = (function() {
  // Internal variables
  let displayMode = 'pieChart'; // Default display mode
  let chartInstance = null;
  
  // Create toggle UI for switching between display modes
  function createToggleUI(dashboard) {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'display-toggle-container';
    
    const toggleLabel = document.createElement('span');
    toggleLabel.textContent = 'Display Mode: ';
    toggleContainer.appendChild(toggleLabel);
    
    const pieChartBtn = document.createElement('button');
    pieChartBtn.textContent = 'Pie Chart';
    pieChartBtn.className = 'display-toggle-btn active';
    pieChartBtn.id = 'pie-chart-btn';
    
    const listViewBtn = document.createElement('button');
    listViewBtn.textContent = 'List View';
    listViewBtn.className = 'display-toggle-btn';
    listViewBtn.id = 'list-view-btn';
    
    pieChartBtn.addEventListener('click', () => {
      setDisplayMode('pieChart');
      pieChartBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    });
    
    listViewBtn.addEventListener('click', () => {
      setDisplayMode('listView');
      listViewBtn.classList.add('active');
      pieChartBtn.classList.remove('active');
    });
    
    toggleContainer.appendChild(pieChartBtn);
    toggleContainer.appendChild(listViewBtn);
    
    // Add toggle UI after the dashboard header
    const dashboardHeader = dashboard.querySelector('.dashboard-header');
    if (dashboardHeader) {
      dashboard.insertBefore(toggleContainer, dashboardHeader.nextSibling);
    } else {
      dashboard.appendChild(toggleContainer);
    }
  }
  
  // Set display mode and update the view
  function setDisplayMode(mode) {
    displayMode = mode;
    updateDisplay();
  }
  
  // Create pie chart from image data
  function createPieChart(images) {
    // Get or create canvas element - FIXING THIS SECTION
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) {
      console.error("Dashboard element not found");
      return;
    }
    
    let chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) {
      // Create new container
      chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      dashboard.appendChild(chartContainer);
      
      // Give the DOM a moment to update
      setTimeout(() => {
        createChart(chartContainer, images);
      }, 50);
    } else {
      // Container exists, create/update chart immediately
      createChart(chartContainer, images);
    }
  }
  
  // Separate function to create the actual chart
  function createChart(container, images) {
    // Destroy previous chart if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    // Ensure container is empty
    container.innerHTML = '';
    
    // Create fresh canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'image-chart';
    canvas.width = 500;  // Set explicit width
    canvas.height = 400; // Set explicit height
    container.appendChild(canvas);
    
    // Create thumbnail element for tooltips
    const imageTooltipContainer = document.createElement('div');
    imageTooltipContainer.id = 'image-tooltip-container';
    imageTooltipContainer.className = 'image-tooltip-container';
    imageTooltipContainer.style.cssText = 'position: absolute; display: none; background: white; border: 1px solid #ccc; border-radius: 4px; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000;';
    container.appendChild(imageTooltipContainer);
    
    // Wait for the canvas to be in the DOM
    setTimeout(() => {
      try {
        // Limit number of slices to avoid overwhelming visuals
        const MAX_SLICES = 99;
        let imagesToDisplay = [...images];
        let otherImagesSize = 0;
        
        // Sort images by size (largest first)
        imagesToDisplay.sort((a, b) => b.size - a.size);
        
        // If too many images, group smallest ones as "Other"
        if (imagesToDisplay.length > MAX_SLICES) {
          otherImagesSize = imagesToDisplay
            .slice(MAX_SLICES - 1)
            .reduce((sum, img) => sum + img.size, 0);
          
          imagesToDisplay = imagesToDisplay.slice(0, MAX_SLICES - 1);
        }
        
        // Calculate total size
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        
        // Prepare chart data
        const data = imagesToDisplay.map(img => img.size);
        const labels = imagesToDisplay.map(img => {
          // Use alt text if available, otherwise fall back to URL-based label
          let label = '';
          
          if (img.elementInfo && img.elementInfo.altText && img.elementInfo.altText.trim() !== '') {
            // Use alt text if available and not empty
            label = img.elementInfo.altText;
          } else {
            // Fall back to URL-based label
            try {
              const url = new URL(img.url);
              const pathParts = url.pathname.split('/');
              label = pathParts[pathParts.length - 1] || url.hostname;
            } catch (e) {
              // If URL parsing fails, use a substring of the URL
              label = img.url.substring(img.url.lastIndexOf('/') + 1);
            }
          }
          
          // Truncate label if too long
          if (label.length > 25) {
            label = label.substring(0, 22) + '...';
          }
          return `${label} (${formatBytes(img.size)})`;
        });
        
        // Add "Other" category if needed
        if (otherImagesSize > 0) {
          data.push(otherImagesSize);
          labels.push(`Other Images (${formatBytes(otherImagesSize)})`);
        }
        
        const backgroundColors = generateColors(data.length);
        
        // Get context and create chart
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error("Could not get canvas context");
          return;
        }
        
        console.log("Creating chart with", labels.length, "slices");
        chartInstance = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: backgroundColors,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            onHover: (event, elements) => {
              // Show/hide thumbnail on hover
              if (elements && elements.length > 0) {
                const index = elements[0].index;
                if (index < imagesToDisplay.length) {
                  const img = imagesToDisplay[index];
                  showImageThumbnail(img, event, imageTooltipContainer);
                } else {
                  hideImageThumbnail(imageTooltipContainer);
                }
              } else {
                hideImageThumbnail(imageTooltipContainer);
              }
            },
            plugins: {
              legend: {
                position: 'right',
                maxHeight: 400,
                labels: {
                  boxWidth: 15,
                  font: {
                    size: 10
                  }
                }
              },
              title: {
                display: true,
                text: `Total Image Size: ${formatBytes(totalSize)}`
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const percentage = Math.round(context.raw / totalSize * 100);
                    return `${context.label}: ${percentage}%`;
                  },
                  afterLabel: function(context) {
                    const index = context.dataIndex;
                    if (index < imagesToDisplay.length) {
                      const img = imagesToDisplay[index];
                      // Show alt text in tooltip if available
                      let altText = img.elementInfo?.altText ? `Alt: "${img.elementInfo.altText}"` : '';
                      let url = `URL: ${img.url.substring(0, 50)}${img.url.length > 50 ? '...' : ''}`;
                      return [altText, url].filter(Boolean).join('\n');
                    }
                    return '';
                  }
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("Error creating chart:", error);
      }
    }, 0);
  }
  
  // Function to show image thumbnail on hover
  function showImageThumbnail(img, event, tooltipContainer) {
    if (!img || !img.url || !tooltipContainer) return;
    
    // Create or update thumbnail content
    tooltipContainer.innerHTML = '';
    
    // Create image element
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = img.url;
    thumbnailImg.alt = img.elementInfo?.altText || 'Image thumbnail';
    thumbnailImg.style.maxWidth = '150px';
    thumbnailImg.style.maxHeight = '150px';
    thumbnailImg.style.display = 'block';
    
    // Add fallback for image loading errors
    thumbnailImg.onerror = function() {
      this.src = 'placeholder.png'; // Fallback if image can't be loaded
      this.alt = 'Image could not be loaded';
    };
    
    tooltipContainer.appendChild(thumbnailImg);
    
    // Position tooltip near cursor
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      const containerRect = chartContainer.getBoundingClientRect();
      const x = event.native.clientX - containerRect.left + 15; // Offset from cursor
      const y = event.native.clientY - containerRect.top - 10;
      
      tooltipContainer.style.left = `${x}px`;
      tooltipContainer.style.top = `${y}px`;
      tooltipContainer.style.display = 'block';
    }
  }
  
  // Function to hide image thumbnail
  function hideImageThumbnail(tooltipContainer) {
    if (tooltipContainer) {
      tooltipContainer.style.display = 'none';
    }
  }
  
  // Create list view of images sorted by size
  function createListView(images) {
    // Sort images by size (descending)
    const sortedImages = [...images].sort((a, b) => b.size - a.size);
    
    // Create or get list container
    let listContainer = document.getElementById('image-list-container');
    if (!listContainer) {
      listContainer = document.createElement('div');
      listContainer.id = 'image-list-container';
      listContainer.className = 'image-list-container';
      document.getElementById('dashboard').appendChild(listContainer);
    } else {
      // Clear existing content
      listContainer.innerHTML = '';
    }
    
    // Add title and total size
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const listTitle = document.createElement('h2');
    listTitle.textContent = `Images by Size (Total: ${formatBytes(totalSize)})`;
    listContainer.appendChild(listTitle);
    
    // Create list of images
    sortedImages.forEach((img, index) => {
      const imageItem = document.createElement('div');
      imageItem.className = 'image-list-item';
      
      // Create thumbnail
      const thumbnail = document.createElement('div');
      thumbnail.className = 'image-thumbnail';
      
      // Create image element for thumbnail
      const imgElement = document.createElement('img');
      imgElement.src = img.url;
      
      // Use alt text if available or generate one
      if (img.elementInfo && img.elementInfo.altText && img.elementInfo.altText.trim() !== '') {
        imgElement.alt = img.elementInfo.altText;
      } else {
        imgElement.alt = `Image ${index + 1}`;
      }
      
      imgElement.onerror = function() {
        this.src = 'placeholder.png'; // Fallback if image can't be loaded
        this.alt = 'Image could not be loaded';
      };
      thumbnail.appendChild(imgElement);
      
      // Create info section
      const infoSection = document.createElement('div');
      infoSection.className = 'image-info';
      
      // Add title/alt text if available
      if (img.elementInfo && img.elementInfo.altText && img.elementInfo.altText.trim() !== '') {
        const altInfo = document.createElement('div');
        altInfo.className = 'image-alt';
        altInfo.textContent = `Alt: "${img.elementInfo.altText}"`;
        infoSection.appendChild(altInfo);
      }
      
      // Add file size
      const sizeInfo = document.createElement('div');
      sizeInfo.className = 'image-size';
      sizeInfo.textContent = `Size: ${formatBytes(img.size)}`;
      infoSection.appendChild(sizeInfo);
      
      // Add image type
      const typeInfo = document.createElement('div');
      typeInfo.className = 'image-type';
      typeInfo.textContent = `Type: ${img.type || 'Unknown'}`;
      infoSection.appendChild(typeInfo);
      
      // Add dimensions if available
      const dimensionsInfo = document.createElement('div');
      dimensionsInfo.className = 'image-dimensions';
      if (img.elementInfo && img.elementInfo.width && img.elementInfo.height) {
        dimensionsInfo.textContent = `Dimensions: ${img.elementInfo.width} × ${img.elementInfo.height}`;
      } else {
        dimensionsInfo.textContent = 'Dimensions: Unknown';
      }
      infoSection.appendChild(dimensionsInfo);
      
      // Add URL as shortened text
      const urlInfo = document.createElement('div');
      urlInfo.className = 'image-url';
      const urlText = img.url.length > 60 ? img.url.substring(0, 57) + '...' : img.url;
      urlInfo.title = img.url; // Full URL on hover
      urlInfo.textContent = urlText;
      infoSection.appendChild(urlInfo);
      
      // Assemble item
      imageItem.appendChild(thumbnail);
      imageItem.appendChild(infoSection);
      
      // Add to container
      listContainer.appendChild(imageItem);
    });
  }
  
  // Update the display based on current mode and image data
  function updateDisplay() {
    // Clear previous display elements
    const dashboard = document.getElementById('dashboard');
    const chartContainer = document.getElementById('image-chart')?.closest('.chart-container');
    const listContainer = document.getElementById('image-list-container');
    
    if (chartContainer) {
      chartContainer.style.display = displayMode === 'pieChart' ? 'block' : 'none';
    }
    
    if (listContainer) {
      listContainer.style.display = displayMode === 'listView' ? 'block' : 'none';
    }
    
    // REVISED: Get image data directly from the collectedImages array in image-reciever.js
    // We need to access it through the window object
    const images = window.imageReceiver?.getCollectedImages() || [];
    console.log("Images for display:", images);
    
    if (images.length === 0) {
      // Show message if no images
      let noDataMsg = document.getElementById('no-data-message');
      if (!noDataMsg) {
        noDataMsg = document.createElement('div');
        noDataMsg.id = 'no-data-message';
        noDataMsg.className = 'no-data-message';
        noDataMsg.textContent = 'No image data collected yet. Click "Analyze Images" to start collecting data.';
        dashboard.appendChild(noDataMsg);
      }
      return;
    }
    
    // Hide no data message if it exists
    const noDataMsg = document.getElementById('no-data-message');
    if (noDataMsg) {
      noDataMsg.style.display = 'none';
    }
    
    // Create the appropriate view
    if (displayMode === 'pieChart') {
      createPieChart(images);
    } else {
      createListView(images);
    }
  }
  
  // Initialize the display
  function initialize() {
    const dashboard = document.getElementById('dashboard');
    
    // Create toggle UI
    createToggleUI(dashboard);
    
    // Set up listener for image data updates
    document.addEventListener('imageDataUpdated', () => {
      updateDisplay();
    });
    
    // Initial display update
    updateDisplay();
  }
  
  // Helper function to format bytes
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  // Helper function to generate colors for the pie chart
  function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137.5) % 360; // Use golden angle approximation
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
  }
  
  // Return public methods
  return {
    initialize: initialize,
    updateDisplay: updateDisplay,
    setDisplayMode: setDisplayMode
  };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing display images module");
  window.displayImages.initialize();
  
  // Add listener to update images display when "Analyze" button is clicked
  document.getElementById('analyze-btn').addEventListener('click', function() {
    // Add slight delay to allow image data to be processed
    setTimeout(() => {
      window.displayImages.updateDisplay();
    }, 500);
  });
});
