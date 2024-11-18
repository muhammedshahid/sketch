# Pencil Sketch Converter with JavaScript

This project allows users to convert images into pencil sketches using **client-side processing**. The conversion process includes several custom-built algorithms in **vanilla JavaScript**, such as Sobel Operator, Gaussian Blur, Invert, Histogram Equalization, and Grayscale Conversion. 

## Live
- 

## Key Features
- **Grayscale Conversion**: Step 1 of the process where the image is converted to grayscale for easier processing.
- **Sobel Operator**: Used to detect edges and generate a pencil-sketch effect.
- **Gaussian Blur**: Smooths the image to reduce noise and create softer edges.
- **Invert**: Inverts the grayscale image to create a sketch effect.
- **Histogram Equalization**: Enhances the image contrast and brightness.
- **Adjustable Brightness & Contrast**: Allows users to fine-tune the final output with sliders.
- **Web Workers**: Utilizes Web Workers for handling computationally heavy tasks and enhancing performance.
- **IndexedDB Storage**: Stores the processed results and variations locally in the user's browser for easy retrieval.

## How It Works
1. **Step 1: Grayscale Conversion**: The image is first converted into grayscale to prepare for edge detection.
2. **Step 2: Sobel Operator**: Detects edges in the image and enhances the sketch effect.
3. **Step 3: Gaussian Blur**: Applied to the image to soften the edges and reduce noise.
4. **Step 4: Invert**: Inverts the grayscale image to create a light/dark pencil effect.
5. **Step 5: Histogram Equalization**: Enhances the brightness and contrast for better visual appeal.
6. **Step 6: Adjustment**: Brightness and contrast sliders allow users to fine-tune the final output.
7. **Step 7: Version Storage**: Users can store different versions of their image variations locally using IndexedDB.

## Technologies Used
- **JavaScript**: Vanilla JS used for implementing all algorithms and features.
- **Canvas API**: For rendering and processing image data.
- **Web Workers**: For offloading mathematical processing tasks to separate threads.
- **IndexedDB**: For storing processed images and variations locally in the browser.

## How to Use
- Clone the repository:
   ```bash
   git clone https://github.com/your-username/pencil-sketch-converter.git
- Open index.html in a browser.
- Upload an image, and the pencil sketch effect will be applied automatically.
- Adjust the brightness and contrast using the sliders.
- Store different versions of the processed image in your browser's IndexedDB.

## Future Improvements
- Real-time preview while adjusting the sliders.
- Additional sketch styles (e.g., color pencil effect).
- Option to download the final image or share on social media.
- WebCam integration for live image processing.
## Contributing
- Contributions are welcome! Feel free to submit issues or pull requests to improve the project.
