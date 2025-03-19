console.log(co2);

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dashboard = document.getElementById('dashboard');
    const controls = document.querySelector('.controls');
    const analyzeBtn = document.getElementById('analyze-btn');
    const backBtn = document.getElementById('back-btn');
    const clearBtn = document.getElementById('clear-btn');
    const countrySelect = document.getElementById('country-select');
    const desktopBtn = document.getElementById('desktop-btn');
    const tabletBtn = document.getElementById('tablet-btn');
    const phoneBtn = document.getElementById('phone-btn');
    
    // Initialize view state
    function showControls() {
        dashboard.style.display = 'none';
        controls.style.display = 'flex';
        // Set analyzeImages flag to false when returning to controls
        window.flagSetter.setAnalyzeImagesFlag(false);
    }
    
    function showDashboard() {
        controls.style.display = 'none';
        dashboard.style.display = 'block';
        // Set analyzeImages flag to true when showing dashboard
        window.flagSetter.setAnalyzeImagesFlag(true);
    }
    
    // Set initial state: show controls, hide dashboard
    showControls();
    
    // Set initial screen size flag (desktop is active by default)
    window.flagSetter.setScreenSize('desktop');
    
    // Set initial country selection flag
    window.flagSetter.setSelectedCountry(countrySelect.value);
    
    // Event Listeners
    analyzeBtn.addEventListener('click', function() {
        showDashboard();
        // Other analysis logic will go here
    });
    
    backBtn.addEventListener('click', function() {
        showControls();
    });
    
    clearBtn.addEventListener('click', function() {
        // Clear dashboard content except for the back button
        const dashboardContent = Array.from(dashboard.children);
        dashboardContent.forEach(child => {
            if (!child.classList.contains('dashboard-header')) {
                dashboard.removeChild(child);
            }
        });
    });
    
    // Country select event listener
    countrySelect.addEventListener('change', function() {
        // Update the selected country flag
        window.flagSetter.setSelectedCountry(this.value);
    });
    
    // Screen size button event listeners
    const screenSizeButtons = document.querySelectorAll('.screen-size-btn');
    
    screenSizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            screenSizeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            this.classList.add('active');
            
            // Determine which screen size was selected and set the flag
            let screenSize = 'desktop'; // Default
            if (this === desktopBtn) {
                screenSize = 'desktop';
            } else if (this === tabletBtn) {
                screenSize = 'tablet';
            } else if (this === phoneBtn) {
                screenSize = 'phone';
            }
            
            // Set the screen size flag
            window.flagSetter.setScreenSize(screenSize);
        });
    });
    
    // Get the country data from co2.js
    if (typeof co2 !== "undefined" && co2.averageIntensity && co2.averageIntensity.data) {
        // Convert the data to an array of [code, value] pairs and sort by country code
        const countries = Object.entries(co2.averageIntensity.data)
            .filter(([code]) => code !== 'WORLD')
            .sort((a, b) => a[0].localeCompare(b[0]));

        // Add options for each country
        countries.forEach(([code, value]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} (${value} gCO2/kWh)`;
            countrySelect.appendChild(option);
        });
    }
});

