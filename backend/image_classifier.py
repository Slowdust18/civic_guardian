# backend/image_classifier.py
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import json
import io
from typing import Optional, Tuple
# --- Load Model and Mappings on Startup ---
try:
    model = tf.keras.models.load_model("ml_model/issue_classifier.h5")

    with open("ml_model/class_indices.json", "r") as f:
        class_indices = json.load(f)

    labels = {v: k for k, v in class_indices.items()}

    department_mapping = {
        "pothole": "Roads",
        "street light": "Electricity",
        "drainage": "Water",
        "bridges": "Roads", # Or a specific bridges department
        "buildings": "govt buildings",
        "deck": "Roads",
        "pavement": "Roads",
        "wall": "govt buildings",
    }
    print("✅ TensorFlow model and class indices loaded successfully.")
except Exception as e:
    model = None
    print(f"🔥 Error loading TensorFlow model: {e}")


def predict_issue_from_image_tf(image_bytes: bytes) -> Optional[str]:
    """
    Takes image bytes, uses the TensorFlow model to predict the issue,
    and returns ONLY the mapped department.
    """
    if not model:
        return None
    try:
        img = image.load_img(io.BytesIO(image_bytes), target_size=(224, 224))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        preds = model.predict(img_array, verbose=0)
        predicted_class = labels[np.argmax(preds)]
        department = department_mapping.get(predicted_class, "unassigned")
        return department
    except Exception as e:
        print(f"Error during TF prediction: {e}")
        return None