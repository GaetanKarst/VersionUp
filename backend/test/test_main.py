from unittest.mock import MagicMock

def test_get_strava_auth_url(client):
    """
    Test the endpoint for getting the Strava authorization URL.
    """
    response = client.get("/")
    
    assert response.status_code == 200
    assert "authorization_url" in response.json()
    assert "https://www.strava.com/oauth/authorize" in response.json()["authorization_url"]


def test_list_activities_success(client, mocker, firestore_db_mock):
    """
    Test successfully listing activities when the user is connected to Strava.
    """
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {
        'strava_tokens': {'access_token': 'fake_access_token'}
    }
    firestore_db_mock.collection.return_value.document.return_value.get.return_value = mock_user_doc

    mock_strava_activities = [
        {"name": "Morning Run", "distance": 5000},
        {"name": "Evening Run", "distance": 15000}
    ]
    mocker.patch('app.strava_client.get_activities', return_value = mock_strava_activities)
    response = client.get("/activities", headers={"Authorization": "Bearer fake-token"})
    
    assert response.status_code == 200
    assert response.json() == mock_strava_activities

    firestore_db_mock.collection.return_value.document.assert_called_with("test_user_uid")


def test_list_activities_not_connected(client, firestore_db_mock):
    """
    Test the response when a user is not connected to Strava.
    """
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {}
    firestore_db_mock.collection.return_value.document.return_value.get.return_value = mock_user_doc

    response = client.get("/activities", headers = {"Authorization": "Bearer fake-token"})
    
    assert response.status_code == 401
    assert response.json() == {"detail": "Strava account not connected."}


def test_suggest_workout_with_strava_data(client, mocker, firestore_db_mock):
    """
    Test workout suggestion when the user has Strava data.
    """
    request_body = {
        "goal": "Build Endurance",
        "equipment": "None",
        "time": 60
    }
    
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {
        'strava_tokens': {'access_token': 'fake_access_token'}
    }
    firestore_db_mock.collection.return_value.document.return_value.get.return_value = mock_user_doc

    mocker.patch('app.strava_client.get_activities', return_value=[{"name": "Recent Run", "distance": 10000}])

    mock_ai_response = MagicMock()
    mock_ai_response.choices[0].message.content = "Your personalized workout is..."
    mocker.patch('app.ai_client.client.chat_completion', return_value = mock_ai_response)

    response = client.post("/suggest_workout", json = request_body, headers = {"Authorization": "Bearer fake-token"})

    assert response.status_code == 200
    assert response.json() == {"suggestion": "Your personalized workout is..."}


def test_suggest_workout_no_strava_data(client, mocker, firestore_db_mock):
    """
    Test workout suggestion when the user has no Strava data.
    """
    mock_user_doc = MagicMock()
    mock_user_doc.exists = False
    firestore_db_mock.collection.return_value.document.return_value.get.return_value = mock_user_doc

    mock_ai_response = MagicMock()
    mock_ai_response.choices[0].message.content = "Here is a general workout..."
    mocker.patch('app.ai_client.client.chat_completion', return_value = mock_ai_response)

    request_body = {
        "goal": "Get Fit",
        "equipment": "Bodyweight",
        "time": 30
    }
    response = client.post("/suggest_workout", json = request_body, headers = {"Authorization": "Bearer fake-token"})

    assert response.status_code == 200
    assert response.json() == {"suggestion": "Here is a general workout..."}
