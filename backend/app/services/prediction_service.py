
import os
import gc

# Reduce TensorFlow memory and compilation overhead
os.environ["TF_XLA_FLAGS"] = "--tf_xla_auto_jit=0"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import tensorflow as tf
import numpy as np
import cv2

MODEL_PATH = os.path.join(
    "model",
    "mobilenetv2_pneumonia.keras"
)

IMAGE_SIZE = (224, 224)

# Limit TensorFlow CPU threads
tf.config.threading.set_intra_op_parallelism_threads(1)
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.optimizer.set_jit(False)

# Load model without training optimizer state
model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)


def predict_pneumonia(image_bytes):

    image_array = np.frombuffer(
        image_bytes,
        np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise ValueError("Invalid image file")

    image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    image = cv2.resize(
        image,
        IMAGE_SIZE
    )

    input_image = np.expand_dims(
        image,
        axis=0
    )

    # Direct inference instead of model.predict()
    output = model(
        input_image,
        training=False
    )

    prediction = float(
        output.numpy().reshape(-1)[0]
    )

    predicted_class = (
        "PNEUMONIA"
        if prediction >= 0.5
        else "NORMAL"
    )

    confidence = (
        prediction
        if prediction >= 0.5
        else 1 - prediction
    )

    result = {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 2),
        "gradcam": None
    }

    del image_array
    del image
    del input_image
    del output

    gc.collect()

    return result
