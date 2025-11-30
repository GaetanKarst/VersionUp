from pydantic import BaseModel, Field

class WorkoutRequest(BaseModel):
    goal: str = Field(..., example="Build Endurance")
    equipment: str = Field("", example="Dumbbells, resistance bands")
    time: int = Field(..., gt=0, example=45)
    requirements: str = Field(
        "", example="recent injury, high blood pressure, etc.")
