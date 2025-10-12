import firebase_admin
from firebase_admin import credentials, firestore

# Path to your service account key file
SERVICE_ACCOUNT_KEY_PATH = "firebase-service-account.json"

try:
    # Check if the app is already initialized to prevent errors during hot-reloading
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")

# Initialize Firestore client to be imported by other modules
db = firestore.client()