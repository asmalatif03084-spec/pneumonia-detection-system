
from backend.app.services.supabase_client import supabase

try:
    response = supabase.table("predictions").select("*").limit(1).execute()

    print("Supabase database connected successfully!")
    print("Predictions table is accessible!")
    print("Response:", response.data)

except Exception as error:
    print("Supabase connection failed:", error)
