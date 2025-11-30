from pydantic import BaseModel

class WorkoutToSave(BaseModel):
    suggestion: str
