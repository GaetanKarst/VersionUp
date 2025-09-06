# VersionUp - AI Workout Coach

🚧 Work in Progress 🔧

VersionUp is a web application designed to act as a virtual workout coach. It synchronizes with a user's Strava account to analyze their activity data. Leveraging AI, it provides personalized feedback and recommendations for future workouts based on the user's goals.

This project is mobile-first, ensuring a seamless experience on any device.

## Project Purpose

The primary goal of this project is to serve as a practical learning experience for integrating Artificial Intelligence into a real-world, full-stack application. It explores the end-to-end process from data acquisition (via the Strava API) and data processing to generating intelligent, actionable insights for the user.

## Tech Stack

The project is built with a modern, full-stack architecture:

### Frontend

*   **Framework**: [Next.js](https://nextjs.org/) (v14+)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)

### Backend

*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
*   **Language**: [Python](https://www.python.org/) (3.11+)

### External Services

*   **Data Source**: [Strava API](https://developers.strava.com/)

## Getting Started

To get the project running locally, follow these steps.

### Prerequisites

*   Node.js (v18+)
*   Python (v3.11+)
*   A Strava account and API application credentials.

### Backend Setup

1.  Navigate to the `backend` directory.
2.  Create and activate a virtual environment: `python3 -m venv venv && source venv/bin/activate`
3.  Install dependencies: `pip install -r requirements.txt`
4.  Create a `.env` file from `.env.example` and add your Strava API credentials.
5.  Run the server: `uvicorn main:app --reload`

### Frontend Setup

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
