import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

AI_API_KEY = os.getenv("AI_API_KEY")

def get_ai_client() -> InferenceClient:
    """
    Initializes and returns a Hugging Face InferenceClient.
    """
    if not AI_API_KEY:
        raise ValueError("AI_API_KEY must be set in the environment for the Hugging Face client.")

    return InferenceClient(token=AI_API_KEY)

# Initialize a single client instance to be reused
client = get_ai_client()