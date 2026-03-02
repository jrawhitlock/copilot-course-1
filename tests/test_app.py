from uuid import uuid4


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_all_activities(client):
    response = client.get("/activities")
    payload = response.json()

    assert response.status_code == 200
    assert isinstance(payload, dict)
    assert all("participants" in activity for activity in payload.values())


def test_signup_adds_new_participant(client, isolated_activity):
    activity_name = isolated_activity["name"]
    email = isolated_activity["new_participant"]

    signup_response = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    activities_response = client.get("/activities")

    assert signup_response.status_code == 200
    assert signup_response.json()["message"] == f"Signed up {email} for {activity_name}"
    assert email in activities_response.json()[activity_name]["participants"]


def test_signup_fails_for_duplicate_participant_case_insensitive(client, isolated_activity):
    activity_name = isolated_activity["name"]
    email = isolated_activity["existing_participant"].upper()

    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_fails_for_missing_activity(client):
    activity_name = f"missing-activity-{uuid4().hex[:8]}"
    response = client.post(f"/activities/{activity_name}/signup", params={"email": "user@example.com"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_removes_participant_case_insensitive(client, isolated_activity):
    activity_name = isolated_activity["name"]
    existing_participant = isolated_activity["existing_participant"]
    email = existing_participant.upper()

    response = client.delete(f"/activities/{activity_name}/signup", params={"email": email})
    activities_response = client.get("/activities")

    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {existing_participant} from {activity_name}"
    participants = [participant.lower() for participant in activities_response.json()[activity_name]["participants"]]
    assert existing_participant.lower() not in participants


def test_unregister_fails_when_participant_not_signed_up(client, isolated_activity):
    activity_name = isolated_activity["name"]
    response = client.delete(f"/activities/{activity_name}/signup", params={"email": "missing@mergington.edu"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_unregister_fails_for_missing_activity(client):
    activity_name = f"missing-activity-{uuid4().hex[:8]}"
    response = client.delete(f"/activities/{activity_name}/signup", params={"email": "user@example.com"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"