import json
from io import BytesIO

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from fastapi import HTTPException
from PIL import Image

from app.config import settings


class GeminiFoodRecognizer:
    def __init__(self) -> None:
        key = settings.gemini_api_key.strip() if settings.gemini_api_key else ""
        if not key:
            print("[gemini_service] WARNING: GEMINI_API_KEY is empty or not set")
            self.model = None
            return

        try:
            genai.configure(api_key=key)
            print(f"[gemini_service] API key loaded ({len(key)} chars)")
            
            model_name = self._get_available_model()
            print(f"[gemini_service] Using model: {model_name}")
            self.model = genai.GenerativeModel(model_name)
        except Exception as e:
            print(f"[gemini_service] Error initializing Gemini: {e}")
            self.model = None
    
    def _get_available_model(self) -> str:
        """Try to find an available Gemini model."""
        preferred = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-flash-latest",
            "gemini-pro-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ]
        
        try:
            available = [m.name for m in genai.list_models()]
            print(f"[gemini_service] Total available models: {len(available)}")
            
            for model in preferred:
                if f"models/{model}" in available:
                    print(f"[gemini_service] Found preferred model: {model}")
                    return model
            
            # If no preferred model found, try to find any 'flash' or 'pro' model
            for avail_name in available:
                if "flash" in avail_name.lower() and "latest" not in avail_name:
                    model = avail_name.replace("models/", "")
                    print(f"[gemini_service] Found fallback model: {model}")
                    return model
                    
        except Exception as e:
            print(f"[gemini_service] Could not list models: {e}")
        
        print(f"[gemini_service] Using default model: gemini-2.5-flash")
        return "gemini-2.5-flash"

    def analyze_food_image(self, image_bytes: bytes) -> list[dict]:
        if self.model is None:
            raise HTTPException(
                status_code=500,
                detail="Gemini API key is missing. Set GEMINI_API_KEY in backend/.env",
            )

        image = Image.open(BytesIO(image_bytes))
        prompt = (
    "You are a nutrition recognition AI. Analyze this food image and identify ONLY the main dish or primary food item. "
    "Ignore garnishes, condiments, side ingredients like chilli, lemon, onion, herbs, or decorations. "
    "Return JSON only with this schema: "
    "{\"foods\":[{\"name\":string,\"calories\":number,\"protein\":number,\"carbs\":number,\"fats\":number,\"confidence\":number}]} "
    "Return at most 2 items - only main dishes. Use estimated values per visible serving. confidence must be between 0 and 1. "
    "No markdown, no explanation, only valid JSON."
)

        try:
            response = self.model.generate_content([prompt, image])
        except google_exceptions.ResourceExhausted as exc:
            print(f"[gemini_service] Quota exceeded: {exc}")
            raise HTTPException(
                status_code=429,
                detail="Gemini quota exceeded for this API key. Please check billing/quota and retry.",
            ) from exc
        except google_exceptions.GoogleAPICallError as exc:
            error_msg = str(exc)
            print(f"[gemini_service] API error: {error_msg}")
            raise HTTPException(
                status_code=502,
                detail=f"Gemini API error: {error_msg[:200]}",
            ) from exc
        except Exception as exc:
            error_msg = str(exc)
            print(f"[gemini_service] Unexpected error: {error_msg}")
            raise HTTPException(
                status_code=502,
                detail=f"Gemini error: {error_msg[:200]}",
            ) from exc
        payload = response.text.strip()

        if payload.startswith("```"):
            payload = payload.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(payload)
            foods = parsed.get("foods", [])
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=502, detail="Invalid response from Gemini model") from exc

        normalized = []
        for item in foods:
            normalized.append(
                {
                    "name": str(item.get("name", "Unknown Food"))[:200],
                    "calories": max(float(item.get("calories", 0) or 0), 0),
                    "protein": max(float(item.get("protein", 0) or 0), 0),
                    "carbs": max(float(item.get("carbs", 0) or 0), 0),
                    "fats": max(float(item.get("fats", 0) or 0), 0),
                    "confidence": min(max(float(item.get("confidence", 0.5) or 0.5), 0), 1),
                }
            )

        return normalized


recognizer = GeminiFoodRecognizer()
