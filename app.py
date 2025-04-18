from fastapi import FastAPI, File, UploadFile, Query
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware
import torch
import os
import sys
from pathlib import Path
from ultralytics import YOLO

app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load CIFAR-10 model
cifar_model = keras.models.load_model("cifar10_cnn_model.keras")

# CIFAR-10 class names
cifar_class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer', 
                     'dog', 'frog', 'horse', 'ship', 'truck']

# Load YOLOv8 model
try:
    yolo_model = YOLO('yolov8n.pt')  # Load the nano model (smallest and fastest)
except Exception as e:
    print(f"Error loading YOLOv8 model: {e}")
    yolo_model = None

@app.post("/predict")
async def predict(file: UploadFile = File(...), model_type: str = Query("cifar", enum=["cifar", "yolo"])):
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    if model_type == "cifar":
        # Process for CIFAR-10
        resized_image = image.resize((32, 32))
        img_array = np.array(resized_image) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        
        # Make prediction
        prediction = cifar_model.predict(img_array)
        predicted_class = cifar_class_names[np.argmax(prediction)]
        
        return {"class": predicted_class, "confidence": float(np.max(prediction))}
        
    else:  # model_type == "yolo"
        if yolo_model is None:
            return {"error": "YOLOv8 model not loaded. Please check server logs."}
        
        # Process for YOLOv8
        results = yolo_model(image)
        
        # Extract detection results
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                if box.conf > 0.4:  # Confidence threshold
                    class_name = result.names[int(box.cls)]
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detections.append({
                        "class": class_name,
                        "confidence": float(box.conf),
                        "box": [x1, y1, x2, y2]
                    })
        
        return {
            "detections": detections,
            "count": len(detections),
            "model_type": "yolov8"
        }

@app.get("/models")
async def get_models():
    """Return available models"""
    models = [
        {"id": "cifar", "name": "CIFAR-10 Classifier", "description": "Classifies images into 10 categories"},
        {"id": "yolo", "name": "YOLOv8 Object Detector", "description": "Detects multiple objects in a single image"}
    ]
    return models
