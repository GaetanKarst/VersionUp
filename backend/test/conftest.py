import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# Allows for absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture(scope='session', autouse=True)
def mock_auth():
    """
    Patches firebase_admin.auth.verify_id_token for the entire test session.
    """
    with patch('firebase_admin.auth.verify_id_token', return_value={'uid': 'test_user_uid'}) as mock:
        yield mock

@pytest.fixture(scope='session', autouse = True)
def mock_shared_dependencies():
    """
    Patches modules for the entire test session.
    """
    with patch('firebase_admin.firestore', new_callable = MagicMock, create = True) as mock_firestore:
        
        db_mock = mock_firestore.client.return_value
        
        yield db_mock

@pytest.fixture(scope="module")
def client():
    """
    Provides a TestClient for the FastAPI app.
    The app is imported here to ensure it's done after the patches are active.
    """
    from app.main import app
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def firestore_db_mock(mock_shared_dependencies):
    """
    Provides the patched firestore_db mock and ensures it's reset for each test.
    """
    firestore_mock = mock_shared_dependencies
    firestore_mock.reset_mock()
    return firestore_mock
