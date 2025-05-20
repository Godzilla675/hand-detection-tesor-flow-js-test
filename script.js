// Global variables for elements that might be accessed by multiple functions
let blackBox; // Assigned in window.onload, could be const if properties aren't modified directly later
let cursor; // Reassigned in mainLoop

// Main function to initialize the application once the window is loaded
window.onload = async function() {
    const webcamBtn = document.getElementById('webcam-btn');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const customCursor = document.getElementById('custom-cursor');
    blackBox = document.querySelector('.black-box'); // Assign to global variable

    // --- Canvas Setup ---
    // Set the canvas size based on the aspect ratio of a 15.6-inch laptop screen (1920x1080)
    const screenAspectRatio = 1920 / 1080;
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;

    // Adjust canvas dimensions to maintain the screen aspect ratio
    if (canvasWidth / canvasHeight > screenAspectRatio) {
        // Window is wider than target aspect ratio, adjust width
        canvasWidth = canvasHeight * screenAspectRatio;
    } else {
        // Window is narrower or equal, adjust height
        canvasHeight = canvasWidth / screenAspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // --- Grid Drawing ---
    // Draw a white grid with squares on the canvas
    const squareSize = canvasWidth / 20; // Size of each square in the grid
    const rows = Math.floor(canvasHeight / squareSize);
    const cols = Math.floor(canvasWidth / squareSize);

    context.fillStyle = 'white'; // Set square color
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            context.fillRect(j * squareSize, i * squareSize, squareSize, squareSize);
        }
    }

    // --- Handpose Model and Webcam Initialization ---
    try {
        const model = await handpose.load(); // Load the Handpose model
        let intervalId; // To store the interval ID for hand detection

        // Event listener for the "Use Webcam" button
        webcamBtn.addEventListener('click', async function() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                video.play();
                video.hidden = true; // Hide the raw video element
            } catch (err) {
                console.error('Error accessing webcam:', err);
                alert('Failed to access webcam. Please make sure it is enabled and try again.');
            }
        });

        // Event listener for when the video starts playing
        video.addEventListener('play', function() {
            webcamBtn.style.display = 'none'; // Hide the button
            
            // Start hand detection at approximately 30 FPS
            intervalId = setInterval(async function() {
                if (video.paused || video.ended) {
                    clearInterval(intervalId); // Stop detection if video stops
                    return;
                }

                // Adjust canvas height to match video aspect ratio if necessary
                const videoAspectRatio = video.videoWidth / video.videoHeight;
                const targetCanvasHeight = canvas.width / videoAspectRatio;
                if (canvas.height !== targetCanvasHeight) {
                    canvas.height = targetCanvasHeight;
                    // Note: Re-drawing grid or other static elements might be needed if canvas size changes often
                }

                // Clear canvas and draw video frame
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Estimate hands from the video frame
                const predictions = await model.estimateHands(video);

                if (predictions.length > 0) {
                    const keypoints = predictions[0].landmarks;
                    
                    // Get coordinates of the index finger tip (landmark 8)
                    const indexFingerTipLandmark = keypoints[8]; 
                    const tipX = indexFingerTipLandmark[0] * canvas.width / video.videoWidth;
                    const tipY = indexFingerTipLandmark[1] * canvas.height / video.videoHeight;
                    const tipZ = indexFingerTipLandmark[2]; // Z-coordinate (depth)

                    // --- Gesture-based Actions ---

                    // 1. Background color change based on index finger lift (Z-coordinate)
                    // A smaller Z value means the finger is closer to the camera (lifted)
                    if (tipZ < -50) { // Threshold for "lifted" can be adjusted
                        document.body.style.backgroundColor = 'green'; 
                    } else {
                        document.body.style.backgroundColor = '#f0f0f0'; // Default background
                    }

                    // 2. Basic click detection: Log if index finger tip is in the top 20% of the canvas
                    if (tipY < canvas.height * 0.2) {
                        console.log('Click detected (index finger in top area)!');
                        // Potential: Call simulateClick() here with a target element
                    }

                    // --- Visualization ---

                    // 1. Draw all hand keypoints
                    for (let i = 0; i < keypoints.length; i++) {
                        const [x, y, z] = keypoints[i];
                        const projectedX = x * canvas.width / video.videoWidth;
                        const projectedY = y * canvas.height / video.videoHeight;
                        context.beginPath();
                        context.arc(projectedX, projectedY, 5, 0, 2 * Math.PI);
                        context.fillStyle = 'red';
                        context.fill();
                    }

                    // 2. Highlight the grid square the index finger is in
                    const fingerCol = Math.floor(tipX / squareSize);
                    const fingerRow = Math.floor(tipY / squareSize);
                    context.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red
                    context.fillRect(fingerCol * squareSize, fingerRow * squareSize, squareSize, squareSize);

                    // 3. Update custom cursor position to follow the index finger tip
                    // This maps canvas coordinates to window coordinates for the absolutely positioned cursor
                    const cursorX = window.innerWidth * (tipX / canvas.width);
                    const cursorY = window.innerHeight * (tipY / canvas.height);
                    customCursor.style.left = `${cursorX}px`;
                    customCursor.style.top = `${cursorY}px`;
                    
                    // --- Complex Gesture Detection ---
                    // Example: Change background to blue if only index and middle fingers are lifted
                    const middleFingerTipLandmark = keypoints[12];
                    // Depth check for other fingers (positive Z means further away or not lifted as much)
                    const thumbTipZ = keypoints[4][2];
                    const ringFingerTipZ = keypoints[16][2];
                    const pinkyTipZ = keypoints[20][2];

                    // Check if index and middle fingers are lifted (close to camera) 
                    // and other fingers are not (further from camera)
                    // Adjusted Z threshold for lifted state, e.g. < -50
                    // Adjusted Z threshold for non-lifted state, e.g. > -30 (allowing some tolerance)
                    if (tipZ < -50 && middleFingerTipLandmark[2] < -50 && 
                        thumbTipZ > -30 && ringFingerTipZ > -30 && pinkyTipZ > -30) {
                        document.body.style.backgroundColor = 'blue'; 
                    }
                }
            }, 1000 / 30); // Approx. 30 FPS
        });
    } catch (err) {
        console.error('Error loading handpose model or during webcam operation:', err);
        alert('Failed to load handpose model or access webcam. Please refresh the page to try again.');
    }

    // --- Main Animation Loop (currently minimal) ---
    // This loop is set up but primarily relies on getHandPosition, which is a placeholder.
    // It will still run via requestAnimationFrame, useful if other global animations are added.
    function mainLoop() {
        // getHandPosition() is a placeholder and needs full implementation
        // for handPosition to be used effectively.
        const handPosition = getHandPosition(); 

        // Update global cursor variable with the custom cursor's current position
        // This is based on the DOM element, which is updated by handpose logic.
        if (customCursor) { // Ensure customCursor exists
             cursor = {
                x: parseFloat(customCursor.style.left),
                y: parseFloat(customCursor.style.top)
            };
        }
        // Call the main loop again on the next frame, creating an animation loop
        requestAnimationFrame(mainLoop);
    }

    // Start the main animation loop
    mainLoop();
}; // End of window.onload

// --- Helper Functions ---

// Function to simulate a click event on a given DOM element
function simulateClick(element) {
    const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(event);
}

// Placeholder function: Intended to get the general position of the hand.
// Needs to be implemented based on hand-tracking data (e.g., average of keypoints).
function getHandPosition() {
    // Placeholder implementation
    // console.log("getHandPosition called, but it's a placeholder.");
    return null; // Return a defined value like null or an object {x, y}
}

// Placeholder function: Intended to check if the hand is in a "closed" gesture.
// Needs to be implemented by analyzing distances between specific keypoints.
function isHandClosed() {
    // Placeholder implementation
    // console.log("isHandClosed called, but it's a placeholder.");
    return false; // Return a boolean
}

// Function to generate a random number between min and max (inclusive of min, exclusive of max)
function random(min, max) {
    return Math.random() * (max - min) + min;
}
