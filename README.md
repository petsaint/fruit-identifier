# Fruit Identifier - Computer Vision Web App

A web application that identifies fruits in images using TensorFlow.js and MobileNet model. Users can either upload an image or use their device's camera to capture an image of a fruit, and the app will identify the fruit with a confidence score.

## Features

- Real-time fruit identification using webcam
- Image upload functionality
- Mobile-responsive design
- Displays top predictions with confidence scores
- Works entirely in the browser (no server required)

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- [TensorFlow.js](https://www.tensorflow.org/js/)
- [MobileNet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) - A pre-trained image classification model
- [Tailwind CSS](https://tailwindcss.com/) - For styling

## How to Use

1. Open the app in a modern web browser
2. Choose one of the following options:
   - Click "Start Webcam" to use your device's camera
   - Click "Upload Image" to upload a photo from your device
3. If using the webcam, position the fruit in view and click "Capture Image"
4. The app will analyze the image and display the identified fruit(s) with confidence scores

## Deployment

This app is designed to be easily deployed to Netlify:

1. Push your code to a GitHub repository
2. Log in to [Netlify](https://www.netlify.com/)
3. Select "New site from Git"
4. Choose your repository and configure the build settings (no build command needed)
5. Deploy!

## Limitations

- The model is trained on a general dataset, so it may not recognize all fruit varieties
- Performance may vary based on lighting conditions and image quality
- Works best with clear, well-lit images of common fruits

## Future Improvements

- Add more specific fruit varieties
- Implement a custom model trained specifically on fruits
- Add the ability to save and share results
- Include nutritional information for identified fruits

## License

This project is open source and available under the MIT License.
