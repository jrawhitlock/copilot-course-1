import copy
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app

INITIAL_ACTIVITIES = copy.deepcopy(activities)


def _restore_activities():
    activities.clear()
    activities.update(copy.deepcopy(INITIAL_ACTIVITIES))


@pytest.fixture(autouse=True)
def reset_activities():
    _restore_activities()
    yield
    _restore_activities()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def isolated_activity():
    activity_name = f"test-activity-{uuid4().hex[:8]}"
    existing_participant = f"existing-{uuid4().hex[:8]}@example.com"
    new_participant = f"new-{uuid4().hex[:8]}@example.com"

    activities[activity_name] = {
        "description": "Temporary activity for test isolation",
        "schedule": "Fridays, 1:00 PM - 2:00 PM",
        "max_participants": 3,
        "participants": [existing_participant],
    }

    return {
        "name": activity_name,
        "existing_participant": existing_participant,
        "new_participant": new_participant,
    }