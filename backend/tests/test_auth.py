from datetime import timedelta
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, Settings, get_db
from app.main import app
from app.models import User
from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    login_rate_limiter,
    verify_dummy_password,
    verify_password,
)


@pytest.fixture(name="db_session")
def fixture_db_session():
    """Isolated SQLite in-memory test database."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(name="client")
def fixture_client(db_session):
    """Test client using isolated test database with rate limiter reset."""
    login_rate_limiter.reset()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    login_rate_limiter.reset()


# 1. Successful signup
def test_signup_success(client):
    response = client.post(
        "/auth/signup",
        json={
            "full_name": "Alice Johnson",
            "email": "alice@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["full_name"] == "Alice Johnson"
    assert data["role"] == "employee"
    assert data["is_active"] is True
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


# 2. Email normalization
def test_email_normalization(client, db_session):
    response = client.post(
        "/auth/signup",
        json={
            "full_name": "   Jane   Doe   ",
            "email": "   Jane.DOE@Example.COM   ",
            "password": "Password123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "jane.doe@example.com"
    assert data["full_name"] == "Jane Doe"

    # Verify normalization directly in database
    db_user = db_session.query(User).filter(User.email == "jane.doe@example.com").first()
    assert db_user is not None
    assert db_user.email == "jane.doe@example.com"
    assert db_user.full_name == "Jane Doe"


# 3. Duplicate email rejection
def test_duplicate_email_rejection(client):
    client.post(
        "/auth/signup",
        json={
            "full_name": "Bob Smith",
            "email": "bob@example.com",
            "password": "Password123!",
        },
    )
    # Attempt duplicate signup with different casing and whitespace
    response = client.post(
        "/auth/signup",
        json={
            "full_name": "Bob Smith Duplicate",
            "email": "  BOB@EXAMPLE.COM  ",
            "password": "Password456!",
        },
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


# 4. Concurrent duplicate signup handling (simulating DB unique violation)
def test_concurrent_duplicate_signup_handling(client, db_session):
    # Simulate race condition where pre-check passes, but commit raises IntegrityError
    def mock_commit():
        raise IntegrityError(
            statement="INSERT INTO users ...",
            params={},
            orig=Exception("UNIQUE constraint failed: users.email")
        )

    with patch.object(db_session, "commit", side_effect=mock_commit):
        response = client.post(
            "/auth/signup",
            json={
                "full_name": "Racer One",
                "email": "racer@example.com",
                "password": "Password123!",
            },
        )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


# 5. Argon2 hashing and password verification
def test_argon2_hashing_and_password_verification():
    plain = "SuperSecretPassword123!"
    hashed = hash_password(plain)

    # Must not store plaintext
    assert plain not in hashed
    # Must use Argon2id
    assert "$argon2" in hashed
    # Correct password verifies
    assert verify_password(plain, hashed) is True
    # Incorrect password fails
    assert verify_password("WrongPassword123!", hashed) is False

    # Dummy password verification
    assert verify_dummy_password("any_password") is False


# 6. Successful login
def test_login_success(client):
    client.post(
        "/auth/signup",
        json={
            "full_name": "Carol Danvers",
            "email": "carol@example.com",
            "password": "CarolPassword123!",
        },
    )
    response = client.post(
        "/auth/login",
        json={
            "email": "carol@example.com",
            "password": "CarolPassword123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Decode and verify token contents
    payload = decode_access_token(data["access_token"])
    assert "sub" in payload
    assert "exp" in payload
    assert "iat" in payload


# 7. Invalid email and password
def test_invalid_email_and_password(client):
    client.post(
        "/auth/signup",
        json={
            "full_name": "Dave Miller",
            "email": "dave@example.com",
            "password": "DavePassword123!",
        },
    )

    # Wrong password for existing user
    resp = client.post(
        "/auth/login",
        json={
            "email": "dave@example.com",
            "password": "WrongPassword!",
        },
    )
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]


# 8. Login attempts for nonexistent accounts
def test_login_nonexistent_account(client):
    resp = client.post(
        "/auth/login",
        json={
            "email": "nobody@example.com",
            "password": "SomePassword123!",
        },
    )
    assert resp.status_code == 401
    # Generic error message must not leak whether the user exists
    assert "Invalid email or password" in resp.json()["detail"]


# 9. Inactive accounts
def test_inactive_accounts(client, db_session):
    inactive_user = User(
        full_name="Inactive User",
        email="inactive@example.com",
        password_hash=hash_password("InactivePass123!"),
        role="employee",
        is_active=False,
    )
    db_session.add(inactive_user)
    db_session.commit()
    db_session.refresh(inactive_user)

    # Login rejection
    login_resp = client.post(
        "/auth/login",
        json={
            "email": "inactive@example.com",
            "password": "InactivePass123!",
        },
    )
    assert login_resp.status_code == 401
    assert "inactive" in login_resp.json()["detail"].lower()

    # /auth/me rejection
    token = create_access_token({"sub": str(inactive_user.id)})
    me_resp = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 401
    assert "inactive" in me_resp.json()["detail"].lower()


# 10. Valid, malformed, and expired JWTs
def test_jwt_valid_malformed_and_expired():
    token = create_access_token({"sub": "99"})
    payload = decode_access_token(token)
    assert payload["sub"] == "99"

    # Expired token
    expired_token = create_access_token(
        {"sub": "99"},
        expires_delta=timedelta(seconds=-10)
    )
    with pytest.raises(HTTPException) as exc_expired:
        decode_access_token(expired_token)
    assert exc_expired.value.status_code == 401
    assert "expired" in exc_expired.value.detail.lower()

    # Malformed token string
    with pytest.raises(HTTPException) as exc_malformed:
        decode_access_token("not.a.valid.jwt")
    assert exc_malformed.value.status_code == 401

    # Missing sub claim
    import jwt
    from app.database import settings
    token_no_sub = jwt.encode(
        {"exp": 9999999999, "iat": 1000000000},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    with pytest.raises(HTTPException) as exc_no_sub:
        decode_access_token(token_no_sub)
    assert exc_no_sub.value.status_code == 401

    # Invalid non-integer sub claim
    token_bad_sub = jwt.encode(
        {"sub": "not_an_int", "exp": 9999999999, "iat": 1000000000},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    with pytest.raises(HTTPException) as exc_bad_sub:
        decode_access_token(token_bad_sub)
    assert exc_bad_sub.value.status_code == 401


# 11. Missing and invalid authorization headers
def test_missing_and_invalid_authorization_headers(client):
    # No header
    r1 = client.get("/auth/me")
    assert r1.status_code == 401
    assert r1.headers.get("WWW-Authenticate") == "Bearer"

    # Non-Bearer scheme
    r2 = client.get("/auth/me", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert r2.status_code == 401

    # Empty token
    r3 = client.get("/auth/me", headers={"Authorization": "Bearer "})
    assert r3.status_code == 401


# 12. /auth/me with valid and invalid tokens
def test_auth_me_valid_and_invalid_tokens(client):
    signup_resp = client.post(
        "/auth/signup",
        json={
            "full_name": "Eve Adams",
            "email": "eve@example.com",
            "password": "EvePassword123!",
        },
    )
    token = client.post(
        "/auth/login",
        json={"email": "eve@example.com", "password": "EvePassword123!"},
    ).json()["access_token"]

    # Valid token
    r_valid = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_valid.status_code == 200
    assert r_valid.json()["id"] == signup_resp.json()["id"]

    # Valid token structure, but user does not exist in DB
    ghost_token = create_access_token({"sub": "999999"})
    r_ghost = client.get("/auth/me", headers={"Authorization": f"Bearer {ghost_token}"})
    assert r_ghost.status_code == 401
    assert "User not found" in r_ghost.json()["detail"]


# 13. Public signup attempts to assign the admin role
def test_public_signup_cannot_assign_admin_role(client):
    response = client.post(
        "/auth/signup",
        json={
            "full_name": "Sneaky Attacker",
            "email": "attacker@example.com",
            "password": "AttackerPassword123!",
            "role": "admin",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "employee"


# 14. Password hashes never appearing in API responses
def test_password_hashes_never_appear_in_responses(client):
    signup_resp = client.post(
        "/auth/signup",
        json={
            "full_name": "Privacy Check",
            "email": "privacy@example.com",
            "password": "PrivacyPassword123!",
        },
    )
    signup_data = signup_resp.json()
    assert "password" not in signup_data
    assert "password_hash" not in signup_data

    login_resp = client.post(
        "/auth/login",
        json={"email": "privacy@example.com", "password": "PrivacyPassword123!"},
    )
    login_data = login_resp.json()
    assert "password" not in login_data
    assert "password_hash" not in login_data

    me_resp = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {login_data['access_token']}"},
    )
    me_data = me_resp.json()
    assert "password" not in me_data
    assert "password_hash" not in me_data


# 15. Database errors and transaction rollback
def test_database_errors_and_transaction_rollback(client, db_session):
    def mock_db_error():
        raise OperationalError("SELECT ...", {}, Exception("Connection failure"))

    with patch.object(db_session, "commit", side_effect=mock_db_error):
        response = client.post(
            "/auth/signup",
            json={
                "full_name": "Crash Test",
                "email": "crash@example.com",
                "password": "CrashPassword123!",
            },
        )
    assert response.status_code == 500
    # Must not leak SQL or connection details
    detail = response.json()["detail"]
    assert "Connection failure" not in detail
    assert "SELECT" not in detail
    assert "database error occurred" in detail.lower()


# 16. JWT configuration validation
def test_jwt_configuration_validation():
    # Insecure default secret must be rejected
    with pytest.raises(ValueError) as exc_insecure:
        Settings.validate_jwt_secret_value("secret")
    assert "insecure development default" in str(exc_insecure.value).lower()

    # Short secret (<32 chars) must be rejected
    with pytest.raises(ValueError) as exc_short:
        Settings.validate_jwt_secret_value("too_short_key_under_32_chars")
    assert "at least 32 characters" in str(exc_short.value).lower()

    # Empty secret must be rejected
    with pytest.raises(ValueError) as exc_empty:
        Settings.validate_jwt_secret_value("   ")
    assert "cannot be empty" in str(exc_empty.value).lower()

    # Strong 32+ char secret must pass
    valid_key = "a" * 32
    assert Settings.validate_jwt_secret_value(valid_key) == valid_key


# 17. Login rate limiting
def test_login_rate_limiting(client):
    login_rate_limiter.reset()

    # Attempt 5 logins (the allowed limit)
    for _ in range(5):
        resp = client.post(
            "/auth/login",
            json={"email": "nobody@example.com", "password": "WrongPassword!"},
        )
        assert resp.status_code == 401

    # 6th attempt from the same client should trigger rate limiting (429)
    resp_limited = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "WrongPassword!"},
    )
    assert resp_limited.status_code == 429
    assert "Too many login attempts" in resp_limited.json()["detail"]


# 18. Existing health endpoints work (isolated)
def test_existing_health_endpoints_work(client):
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert r_root.json()["message"] == "Welcome to Safe Company Chatbot API"

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "ok"

    # Test /health/database with mocked connection to ensure isolation
    with patch("app.main.engine.connect") as mock_conn:
        mock_conn.return_value.__enter__.return_value.execute.return_value = None
        r_db_ok = client.get("/health/database")
        assert r_db_ok.status_code == 200
        assert r_db_ok.json() == {"database": "connected", "status": "ok"}

    # Test /health/database handles database connection failure gracefully
    with patch("app.main.engine.connect", side_effect=Exception("DB Down")):
        r_db_err = client.get("/health/database")
        assert r_db_err.status_code == 200
        assert r_db_err.json() == {"database": "unavailable", "status": "error"}

