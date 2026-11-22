
import tensorflow as tf
import numpy as np
import cv2
import os
import base64

MODEL_PATH = os.path.join(
    "model",
    "mobilenetv2_pneumonia.keras"
)

model = tf.keras.models.load_model(MODEL_PATH)

IMAGE_SIZE = (224, 224)
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]

# MobileNetV2 feature extraction layer
base_model = model.layers[1]


def make_gradcam_heatmap(img_array):

    img_tensor = tf.convert_to_tensor(
        img_array,
        dtype=tf.float32
    )

    preprocessed = (
        tf.keras.applications.mobilenet_v2.preprocess_input(
            img_tensor
        )
    )

    with tf.GradientTape() as tape:

        conv_outputs = base_model(
            preprocessed,
            training=False
        )

        tape.watch(conv_outputs)

        x = model.layers[2](conv_outputs)
        x = model.layers[3](x, training=False)
        predictions = model.layers[4](x)

        loss = predictions[:, 0]

    grads = tape.gradient(loss, conv_outputs)

    pooled_grads = tf.reduce_mean(
        grads,
        axis=(0, 1, 2)
    )

    conv_outputs = conv_outputs[0]

    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    heatmap = tf.maximum(heatmap, 0)

    heatmap = heatmap / (
        tf.reduce_max(heatmap) + 1e-8
    )

    return heatmap.numpy()


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

    original_image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    resized_image = cv2.resize(
        original_image,
        IMAGE_SIZE
    )

    input_image = np.expand_dims(
        resized_image,
        axis=0
    )

    prediction = model.predict(
        input_image,
        verbose=0
    )[0][0]

    predicted_class = (
        "PNEUMONIA" if prediction >= 0.5 else "NORMAL"
    )

    confidence = (
        float(prediction)
        if prediction >= 0.5
        else float(1 - prediction)
    )

    # Generate Grad-CAM
    heatmap = make_gradcam_heatmap(input_image)

    heatmap = cv2.resize(
        heatmap,
        (224, 224)
    )

    heatmap_uint8 = np.uint8(255 * heatmap)

    colored_heatmap = cv2.applyColorMap(
        heatmap_uint8,
        cv2.COLORMAP_JET
    )

    colored_heatmap = cv2.cvtColor(
        colored_heatmap,
        cv2.COLOR_BGR2RGB
    )

    overlay = cv2.addWeighted(
        resized_image,
        0.6,
        colored_heatmap,
        0.4,
        0
    )

    # Convert overlay to Base64
    overlay_bgr = cv2.cvtColor(
        overlay,
        cv2.COLOR_RGB2BGR
    )

    success, buffer = cv2.imencode(
        ".png",
        overlay_bgr
    )

    if not success:
        raise ValueError("Grad-CAM image generation failed")

    gradcam_base64 = base64.b64encode(
        buffer
    ).decode("utf-8")

    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 2),
        "gradcam": gradcam_base64
    }
