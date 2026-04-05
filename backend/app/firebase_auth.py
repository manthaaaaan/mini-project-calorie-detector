import os
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

FIREBASE_PROJECT_ID = "calorie-ai-4c320"

bearer_scheme = HTTPBearer()

async def verify_firebase_token(token: str) -> dict:
    """Verify Firebase ID token using Google's public API."""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyBsHa72DKj01xwWL0yGYz0GtQTQ6jIIRAU"
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json={"idToken": token})
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        data = response.json()
        users = data.get("users", [])
        if not users:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return users[0]

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """Verify Firebase ID token and return the user's UID."""
    token = credentials.credentials
    user_data = await verify_firebase_token(token)
    return user_data["localId"]