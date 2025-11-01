// DOM Elements
const preview = document.getElementById('preview');
const webcamElement = document.getElementById('webcam');
const startWebcamButton = document.getElementById('startWebcam');
const captureButton = document.getElementById('capture');
const uploadButton = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const resultDiv = document.getElementById('result');
const modelStatus = document.getElementById('modelStatus');
const modelStatusIndicator = document.getElementById('modelStatusIndicator');

// Model variables
let model;
let webcam;

// Common fruits to identify
const FRUITS = [
    'apple', 'banana', 'orange', 'strawberry', 'grape', 'pineapple', 'blueberry',
    'raspberry', 'peach', 'pear', 'plum', 'cherry', 'kiwi', 'mango', 'lemon',
    'lime', 'watermelon', 'cantaloupe', 'honeydew', 'coconut', 'avocado', 'pomegranate'
];

// Update UI based on model loading state
function updateModelStatus(message, isError = false) {
    modelStatus.textContent = message;
    
    if (isError) {
        modelStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
        modelStatus.className = 'font-medium text-red-600';
    } else {
        modelStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
        modelStatus.className = 'font-medium text-green-600';
    }
}

// Initialize the model
async function initModel() {
    try {
        console.log('Starting model loading...');
        updateModelStatus('Loading TensorFlow.js...');
        
        // First, warm up the TensorFlow.js backend
        await tf.ready();
        console.log('TensorFlow.js is ready');
        
        // Show loading state
        updateModelStatus('Loading model (this may take a minute)...');
        
        try {
            console.log('Loading MobileNet model from CDN...');
            
            // Load MobileNet model with explicit CDN URL
            model = await mobilenet.load({
                version: 2,
                alpha: 1.0,
                modelUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json'
            });
            
            console.log('Model loaded successfully');
            updateModelStatus('Model loaded! Testing...');
            
            // Test the model with a blank tensor to ensure it's working
            try {
                const testTensor = tf.zeros([1, 224, 224, 3]);
                const testPrediction = await model.classify(testTensor);
                console.log('Model test prediction:', testPrediction);
                tf.dispose(testTensor);
                
                updateModelStatus('Ready to identify fruits!');
                return; // Success!
                
            } catch (testError) {
                console.warn('Model test failed, but continuing:', testError);
                updateModelStatus('Model loaded with warnings');
                return; // Still continue even if test fails
            }
            
        } catch (error) {
            console.error('Error loading model:', error);
            
            // Try loading with default settings if explicit URL fails
            try {
                console.log('Trying to load default model...');
                model = await mobilenet.load();
                updateModelStatus('Model loaded! (using fallback)');
                return;
            } catch (fallbackError) {
                console.error('Fallback model loading failed:', fallbackError);
                updateModelStatus('Error loading model. Please check console for details.', true);
                throw fallbackError;
            }
        }
        
    } catch (error) {
        console.error('Error in model initialization:', error);
        updateModelStatus('Error initializing model. Please refresh the page.', true);
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
        // Ensure the image is loaded
        if (!imageElement.complete || imageElement.naturalWidth === 0) {
            await new Promise((resolve) => {
                imageElement.onload = resolve;
                imageElement.onerror = () => {
                    console.error('Error loading image');
                    resolve();
                };
            });
        }

        console.log('Starting image classification...');
        const startTime = performance.now();
        
        // Classify the image with error handling
        let predictions;
        try {
            predictions = await model.classify(imageElement);
            console.log('Classification complete in', (performance.now() - startTime).toFixed(1), 'ms');
            console.log('Raw predictions:', predictions);
        } catch (classifyError) {
            console.error('Error during classification:', classifyError);
            throw new Error('Failed to process image');
        }
        
        // Filter for fruit predictions with better matching
        const fruitPredictions = predictions
            .filter(prediction => {
                const className = prediction.className.toLowerCase();
                return FRUITS.some(fruit => {
                    // Check for exact match or contains fruit name
                    const fruitLower = fruit.toLowerCase();
                    return className === fruitLower || 
                           className.includes(fruitLower + ' ') ||
                           className.includes(' ' + fruitLower) ||
                           className.includes(fruitLower + ',');
                });
            })
            .slice(0, 3); // Get top 3 fruit predictions
        
        // Display results with better formatting
        if (fruitPredictions.length > 0) {
            let resultHTML = '<div class="space-y-2">';
            resultHTML += '<p class="font-semibold">I think this is a:</p>';
            resultHTML += '<ul class="space-y-2">';
            
            fruitPredictions.forEach(prediction => {
                const fruitName = prediction.className
                    .split(',')[0] // Get the first class name
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                    
                const confidence = (prediction.probability * 100).toFixed(1);
                const confidencePercent = `${confidence}%`;
                
                resultHTML += `
                    <li class="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span class="font-medium">${fruitName}</span>
                        <div class="flex items-center">
                            <span class="font-mono text-sm text-gray-500 mr-2">${confidencePercent}</span>
                            <div class="w-16 bg-gray-200 rounded-full h-2.5">
                                <div class="bg-green-500 h-2.5 rounded-full" 
                                     style="width: ${confidence}%"></div>
                            </div>
                        </div>
                    </li>`;
            });
            
            resultHTML += '</ul></div>';
            resultDiv.innerHTML = resultHTML;
        } else {
            // If no fruits detected, show the top predictions for debugging
            const topPredictions = predictions.slice(0, 3);
            let resultHTML = '<div class="text-center py-4">';
            resultHTML += '<p class="text-red-500 font-medium mb-2">No fruits confidently detected</p>';
            resultHTML += '<p class="text-sm text-gray-600 mb-3">Top predictions:</p>';
            resultHTML += '<ul class="space-y-1 text-sm">';
            
            topPredictions.forEach((pred, index) => {
                const className = pred.className.split(',')[0];
                const confidence = (pred.probability * 100).toFixed(1);
                resultHTML += `
                    <li class="flex justify-between">
                        <span>${index + 1}. ${className}</span>
                        <span class="text-gray-500">${confidence}%</span>
                    </li>`;
            });
            
            resultHTML += '</ul>';
            resultHTML += '<p class="mt-3 text-xs text-gray-500">Try a clearer image of a single fruit</p>';
            resultHTML += '</div>';
            resultDiv.innerHTML = resultHTML;
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
