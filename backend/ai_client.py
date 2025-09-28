import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

AI_API_KEY = os.getenv("AI_API_KEY")
AI_API_BASE_URL = os.getenv("AI_API_BASE_URL")

def get_ai_client() -> OpenAI:
    """
    Initializes and returns an AI client configured to connect to a
    generic OpenAI-compatible API endpoint.
    """
    if not AI_API_KEY or not AI_API_BASE_URL:
        raise ValueError("AI_API_KEY and AI_API_BASE_URL must be set in the environment for the AI client.")

    return OpenAI(
        api_key=AI_API_KEY,
        base_url=AI_API_BASE_URL,
    )

# Initialize a single client instance to be reused
client = get_ai_client()