from fastapi import FastAPI, File, UploadFile
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = keras.models.load_model("cifar10_cnn_model.keras")

# CIFAR-10 class names
class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read image
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")  # Convert to RGB
    image = image.resize((32, 32))
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)  # Add batch dimension

    # Make prediction
    prediction = model.predict(image)
    predicted_class = class_names[np.argmax(prediction)]

    return {"class": predicted_class, "confidence": float(np.max(prediction))}

