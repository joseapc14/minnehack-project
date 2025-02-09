const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');


// Function to resize image to 400x400 and apply a full circular cutout
async function createCircularImage(inputPath) {
   try {
       // Load the input image
       const image = await loadImage(inputPath);


       // Set the final output size (400x400)
       const outputSize = 400;


       // Create a canvas with a 400x400 transparent background
       const canvas = createCanvas(outputSize, outputSize);
       const ctx = canvas.getContext('2d');


       // Resize the image to fit entirely within the 400x400 square
       const scale = Math.max(outputSize / image.width, outputSize / image.height); // Ensures the image fully fits
       const newWidth = image.width * scale;
       const newHeight = image.height * scale;


       // Calculate the offsets to center the image within the 400x400 canvas
       const xOffset = (outputSize - newWidth) / 2;
       const yOffset = (outputSize - newHeight) / 2;  


       // Draw the image onto the canvas with scaling and centering
       ctx.drawImage(image, xOffset, yOffset, newWidth, newHeight);


       // Create a circular mask to cut out the circle
       ctx.globalCompositeOperation = 'destination-in';
       ctx.beginPath();
       ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
       ctx.closePath();
       ctx.fill();


       // Return the canvas buffer (PNG format to preserve transparency)
       return canvas.toBuffer('image/png');
   } catch (error) {
       console.error('Error processing image:', error);
   }
}


// Function to add a transparent circle background and center the image inside it
async function addTransparentCircleBackground(inputImageBuffer, outputPath) {
   try {
       // Load the input image buffer into an image
       const image = await loadImage(inputImageBuffer);


       // Set the final output size (420x420)
       const outputSize = 420;
       const circleRadius = 210; // radius of the circle (420px / 2)


       // Create a 420x420 transparent canvas
       const canvas = createCanvas(outputSize, outputSize);
       const ctx = canvas.getContext('2d');


       // Set the global composite operation to 'source-over' for the circle
       ctx.globalCompositeOperation = 'source-over';


       // Outer border (gray)
       ctx.beginPath();
       ctx.arc(outputSize / 2, outputSize / 2, circleRadius, 0, Math.PI * 2); // Outer circle
       ctx.fillStyle = 'gray';
       ctx.fill();


       // Frame (off-white)
       ctx.beginPath();
       ctx.arc(outputSize / 2, outputSize / 2, circleRadius - 1.8, 0, Math.PI * 2); // Frame circle
       ctx.fillStyle = '#f0f0f0'; // Off-white color
       ctx.fill();


       // Inner border (gray) with slightly smaller radius
       ctx.beginPath();
       ctx.arc(outputSize / 2, outputSize / 2, circleRadius - 10, 0, Math.PI * 2); // Inner circle
       ctx.fillStyle = 'gray';
       ctx.fill();


       // Now we center the image within the 420x420 canvas
       const xOffset = (outputSize - image.width) / 2; // Center the image horizontally
       const yOffset = (outputSize - image.height) / 2; // Center the image vertically


       // Draw the image in the center of the canvas
       ctx.drawImage(image, xOffset, yOffset, image.width, image.height);


       // Convert the canvas to a buffer (PNG format to preserve transparency)
       const buffer = canvas.toBuffer('image/png');


       // Save the resulting image with the transparent circle background
       fs.writeFileSync(outputPath, buffer);
       console.log('Image saved as:', outputPath);
   } catch (error) {
       console.error('Error processing image:', error);
   }
}


// Example usage
const inputImagePath = path.join(__dirname, 'test.png'); // Replace with your input image path
const outputImagePath = path.join(__dirname, 'output_with_transparent_circle.png'); // The output image will be saved here


async function processImage() {
   try {
       // Step 1: Create the circular image (400x400)
       const circularImageBuffer = await createCircularImage(inputImagePath);


       // Step 2: Add the transparent circle background and borders (420x420)
       await addTransparentCircleBackground(circularImageBuffer, outputImagePath);
   } catch (error) {
       console.error('Error during image processing:', error);
   }
}


processImage();