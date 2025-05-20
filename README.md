# Live Hand Detection with TensorFlow.js

This project uses `hand detector.html` to perform live hand detection using a webcam, TensorFlow.js, and the `handpose` model.

## Key Features

*   Integrates with the user's webcam.
*   Visualizes hand landmarks (keypoints) on the webcam feed.
*   Overlays a grid on the video.
*   Moves a custom cursor based on the position of the index finger's tip.
*   Changes the webpage background color based on specific finger gestures (e.g., index finger lifted, index and middle fingers lifted).
*   Includes basic click detection (logs to the browser console) when the index finger moves to the top area of the canvas.

## Technologies Used

*   HTML
*   CSS
*   JavaScript
*   TensorFlow.js
*   Handpose Model (from TensorFlow.js models)

## How to Run

1.  Ensure you have a modern web browser that supports webcam access (e.g., Chrome, Firefox, Edge).
2.  Clone or download the repository.
3.  Open the `hand detector.html` file directly in your web browser (e.g., by double-clicking it or using "File > Open" in the browser).
4.  When prompted by the browser, grant permission for the page to access your webcam.
5.  Click the "Use Webcam" button on the page to start the hand detection.

## Potential Further Development

- The project contains some placeholder JavaScript functions such as `getHandPosition()` and `isHandClosed()` that are not fully implemented.
- There is also a `simulateClick()` function that is defined but not currently used to interact with web page elements.
- The `black-box` div element is currently a static overlay and could be made interactive or responsive to hand gestures.
- These represent opportunities for extending the project's functionality, for example, by implementing custom interactions based on hand gestures or state.
