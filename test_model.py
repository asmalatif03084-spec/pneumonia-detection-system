import tensorflow as tf
import os

model_path = os.path.join(
    "model",
    "mobilenetv2_pneumonia.keras"
)

print("Loading MobileNetV2 model...")

model = tf.keras.models.load_model(model_path)

print("Model loaded successfully!")
model.summary()