// DOM Elements
const preview = document.getElementById('preview');
const webcamElement = document.getElementById('webcam');
const startWebcamButton = document.getElementById('startWebcam');
const captureButton = document.getElementById('capture');
const uploadButton = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const resultDiv = document.getElementById('result');
const modelStatus = document.getElementById('modelStatus');

// Model variables
let model;
let webcam;

// Common fruits to identify
const FRUITS = [
    'apple', 'banana', 'orange', 'strawberry', 'grape', 'pineapple', 'blueberry',
    'raspberry', 'peach', 'pear', 'plum', 'cherry', 'kiwi', 'mango', 'lemon',
    'lime', 'watermelon', 'cantaloupe', 'honeydew', 'coconut', 'avocado', 'pomegranate'
];

// Initialize the model
async function initModel() {
    try {
        modelStatus.textContent = 'Loading model...';
        // Load MobileNet model
        model = await mobilenet.load({
            version: 2,
            alpha: 1.0,
            modelUrl: 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json'
        });
        modelStatus.textContent = 'Model loaded successfully!';
        console.log('Model loaded');
    } catch (error) {
        console.error('Error loading model:', error);
        modelStatus.textContent = 'Error loading model. Please refresh the page.';
    }
}

// Initialize webcam
async function initWebcam() {
    try {
        webcam = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment'
            },
            audio: false
        });
        
        webcamElement.srcObject = webcam;
        webcamElement.style.display = 'block';
        preview.style.display = 'none';
        startWebcamButton.style.display = 'none';
        captureButton.classList.remove('hidden');
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Could not access webcam. Please ensure you have granted camera permissions.');
    }
}

// Capture image from webcam
function captureImage() {
    const canvas = document.createElement('canvas');
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to image and display
    preview.src = canvas.toDataURL('image/jpeg');
    preview.style.display = 'block';
    webcamElement.style.display = 'none';
    
    // Process the captured image
    processImage(preview);
}

// Process the image and make predictions
async function processImage(imageElement) {
    if (!model) {
        resultDiv.innerHTML = 'Model not loaded yet. Please wait...';
        return;
    }

    resultDiv.innerHTML = 'Analyzing image...';
    
    try {
        // Classify the image
        const predictions = await model.classify(imageElement);
        
        // Filter for fruit predictions
        const fruitPredictions = predictions
            .filter(prediction => 
                FRUITS.some(fruit => 
                    prediction.className.toLowerCase().includes(fruit)
                )
            )
            .slice(0, 3); // Get top 3 fruit predictions
        
        // Display results
        if (fruitPredictions.length > 0) {
            let resultHTML = '<p>I think this is a:</p><ul class="mt-2 space-y-1">';
            fruitPredictions.forEach(prediction => {
                const fruitName = prediction.className.split(',')[0]; // Get the first class name
                const confidence = (prediction.probability * 100).toFixed(2);
                resultHTML += `
                    <li class="flex justify-between">
                        <span>${fruitName}</span>
                        <span class="confidence">${confidence}%</span>
                    </li>`;
            });
            resultHTML += '</ul>';
            resultDiv.innerHTML = resultHTML;
        } else {
            resultDiv.innerHTML = 'No fruits detected. Try a clearer image.';
        }
    } catch (error) {
        console.error('Error processing image:', error);
        resultDiv.innerHTML = 'Error processing image. Please try again.';
    }
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            webcamElement.style.display = 'none';
            
            // Process the uploaded image
            processImage(preview);
        };
        reader.readAsDataURL(file);
    }
}

// Event Listeners
startWebcamButton.addEventListener('click', initWebcam);
captureButton.addEventListener('click', captureImage);
uploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);

// Initialize the application
initModel();
