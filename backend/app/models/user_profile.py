from pydantic import BaseModel, Field
from typing import Optional

class UserProfile(BaseModel):
    height: Optional[float] = Field(
        None, description="Height in cm", example=180.0)
    weight: Optional[float] = Field(
        None, description="Weight in kg", example=75.0)
    gender: Optional[str] = Field(None, example="Male")
    workout_level: Optional[str] = Field(None, example="Intermediate")
