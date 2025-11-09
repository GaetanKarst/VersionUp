# VersionsUp - AI Workout Coach

🚧 Work in Progress 🔧

VersionsUp is a web application designed to act as a virtual workout coach. It synchronizes with a user's Strava account to analyze their activity data. Leveraging AI, it provides personalized feedback and recommendations for future workouts based on the user's goals.

This project is mobile-first, ensuring a seamless experience on any device.

## Project Purpose

The primary goal of this project is to serve as a practical learning experience for integrating Artificial Intelligence into a real-world, full-stack application. It explores the end-to-end process from data acquisition (via the Strava API) and data processing to generating intelligent, actionable insights for the user.

## Screenshots

<p align="center"><img src="./assets/login_screen.png" alt="Login Screen" width="700"/></p>
<p align="center"><img src="./assets/registration_screen.png" alt="Registration Screen" width="700"/></p>
<p align="center"><img src="./assets/connection-screen.png" alt="Connection Screen" width="700"/></p>
<p align="center"><img src="./assets/activity_screen.png" alt="Activity Screen" width="700"/></p>
<p align="center"><img src="./assets/suggestion_screen.png" alt="Suggestion Screen" width="700"/></p>
<p align="center"><img src="./assets/suggestion_1.png" alt="Workout Suggestion 1" width="700"/></p>
<p align="center"><img src="./assets/suggestion_2.png" alt="Workout Suggestion 2" width="700"/></p>
<p align="center"><img src="./assets/connection_screen_empty.png" alt="Connection Screen Empty" width="700"/></p>
<p align="center"><img src="./assets/connection_screen_workout.png" alt="Connection Screen with Workout" width="700"/></p>
<p align="center"><img src="./assets/full_workout_modal.png" alt="Full Workout Modal" width="700"/></p>

## Tech Stack

The project is built with a modern, full-stack architecture:

### Frontend

*   **Framework**: [Next.js](https://nextjs.org/) (v14+)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)
*   **Testing**: [Vitest](https://vitest.dev/)

### Backend

*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
*   **Language**: [Python](https://www.python.org/) (3.11+)
*   **Testing**: [Pytest](https://pytest.org/)

### External Services

*   **Data Source**: [Strava API](https://developers.strava.com/)
*   **AI Model**: [Llama-3.1-8B-InstructI](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)
*   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **Database**: [Firestore](https://firebase.google.com/docs/firestore)

## Deployment

*   **Frontend**: Deployed on [Vercel](https://vercel.com/).
*   **Backend**: The API is containerized using Docker and deployed on [Google Cloud Run](https://cloud.google.com/run).

## Getting Started

To get the project running locally, follow these steps.

### Prerequisites

*   Node.js (v18+)
*   Python (v3.11+)
*   A Strava account (Optional)

### Backend Setup

1.  Navigate to the `backend` directory.
2.  Create and activate a virtual environment: `python3 -m venv venv && source venv/bin/activate`
3.  Install dependencies: `pip install -r app/requirements.txt`
4.  Create a `.env` file and add your Strava and AI provider credentials.
5.  Download your `firebase-service-account.json` from the Firebase Console and place it in this directory.
6.  Run the server: `uvicorn app.main:app --reload`

#### Running Tests

1.  From the `backend` directory, ensure your virtual environment is activated.
2.  Install test-specific dependencies: `pip install -r test/requirements.txt`
3.  Run the tests: `pytest`

### Frontend Setup

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env.local` file and add your Firebase web app configuration keys (prefixed with `NEXT_PUBLIC_`).
4.  Run the development server: `npm run dev`

#### Running Tests

1.  From the `frontend` directory, run the test command: `npm test`
