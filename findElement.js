// Helper function to extract a URL from a CSS background-image value.
function extractUrl(bgValue) {
    const match = bgValue.match(/url\(["']?([^"')]+)["']?\)/);
    return match ? match[1] : null;
}

// Function to find an element matching the image URL,
// whether it's an <img> (via src, srcset, currentSrc) or a background image.
function findElementByImageUrl(imageUrl) {
    // First try an exact <img> element match.
    let element = document.querySelector(`img[src="${imageUrl}"]`);

    // If no exact match, check all <img> tags for a match in srcset or currentSrc.
    if (!element) {
        const allImages = document.getElementsByTagName('img');
        for (const img of allImages) {
        if (img.srcset && img.srcset.includes(imageUrl)) {
            element = img;
            break;
        }
        if (img.currentSrc === imageUrl) {
            element = img;
            break;
        }
        }
    }

    // If still not found, search all elements for a matching background-image URL.
    if (!element) {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
        const bgValue = window.getComputedStyle(el).getPropertyValue('background-image');
        if (bgValue && bgValue !== 'none') {
            const bgUrl = extractUrl(bgValue);
            // Depending on your needs you can use an exact match or a contains check.
            if (bgUrl && (bgUrl === imageUrl || bgUrl.includes(imageUrl))) {
                element = el;
                break;
            }
        }
        }
    }

    return element;
}