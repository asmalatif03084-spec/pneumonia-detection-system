
from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.app.services.prediction_service import predict_pneumonia
from backend.app.services.supabase_client import supabase

router = APIRouter(prefix="/api", tags=["Pneumonia Prediction"])


# 1. Pneumonia Prediction API
@router.post("/predict")
async def predict(file: UploadFile = File(...)):

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed"
        )

    try:
        image_bytes = await file.read()
        result = predict_pneumonia(image_bytes)

        supabase.table("predictions").insert({
            "image_name": file.filename or "unknown",
            "prediction": result["prediction"],
            "confidence": result["confidence"]
        }).execute()

        return {
            "success": True,
            "result": result,
            "message": "Prediction completed and saved successfully"
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        print("Prediction error:", error)
        raise HTTPException(
            status_code=500,
            detail="Prediction failed or database saving failed"
        )


# 2. Prediction History API
@router.get("/history")
def get_prediction_history():

    try:
        response = (
            supabase.table("predictions")
            .select("id, image_name, prediction, confidence, created_at")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )

        return {
            "success": True,
            "count": len(response.data),
            "history": response.data
        }

    except Exception as error:
        print("History error:", error)
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch prediction history"
        )

# 3. Prediction Statistics API
@router.get("/statistics")
def get_prediction_statistics():

    try:
        response = (
            supabase.table("predictions")
            .select("prediction, confidence")
            .execute()
        )

        records = response.data

        total = len(records)
        normal = sum(1 for item in records if item["prediction"] == "NORMAL")
        pneumonia = sum(1 for item in records if item["prediction"] == "PNEUMONIA")

        average_confidence = (
            sum(float(item["confidence"]) for item in records) / total
            if total > 0 else 0
        )

        return {
            "success": True,
            "total_predictions": total,
            "normal_cases": normal,
            "pneumonia_cases": pneumonia,
            "average_confidence": round(average_confidence, 2)
        }

    except Exception as error:
        print("Statistics error:", error)
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch prediction statistics"
        )
