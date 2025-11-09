import os
import firebase_admin
from firebase_admin import credentials, firestore

try:
    if not firebase_admin._apps:
        if os.getenv('K_SERVICE'):
            # Production environment on Google Cloud
            firebase_admin.initialize_app()
            print("Firebase Admin SDK initialized in PRODUCTION mode.")
        else:
            # Local development
            SERVICE_ACCOUNT_KEY_PATH = os.path.join(os.path.dirname(__file__), "firebase-service-account.json")
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized in LOCAL mode.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")

db = firestore.client()