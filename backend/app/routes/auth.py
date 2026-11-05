import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.audit import (
    ACCOUNT_INACTIVE_ACCESS,
    LOGIN_FAILURE,
    LOGIN_SUCCESS,
    RESOURCE_SESSION,
    RESOURCE_USER,
    SIGNUP_SUCCESS,
    STATUS_DENIED,
    STATUS_FAILURE,
    STATUS_SUCCESS,
    log_event,
)
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, SignupRequest, TokenResponse, UserResponse
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    login_rate_limiter,
    verify_dummy_password,
    verify_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def is_email_unique_violation(err: IntegrityError) -> bool:
    """Determine whether an IntegrityError was caused by a duplicate email constraint."""
    err_str = str(err).lower()
    return (
        "users.email" in err_str
        or "ix_users_email" in err_str
        or "users_email_key" in err_str
        or ("unique" in err_str and "email" in err_str)
    )


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
def signup(
    payload: SignupRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    - Validates email, full_name, and password.
    - Normalizes email addresses consistently (lowercase, stripped).
    - Prevents duplicate registrations, including under race conditions.
    - Hashes password using Argon2.
    - Strictly assigns the 'employee' role.
    """
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    normalized_email = payload.email.strip().lower()

    # Pre-check existing user
    try:
        existing_user = (
            db.query(User)
            .filter(User.email == normalized_email)
            .first()
        )
    except SQLAlchemyError as err:
        db.rollback()
        logger.error("Database error while checking existing user: %s", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while processing your request.",
        )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    hashed_pw = hash_password(payload.password)

    new_user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        password_hash=hashed_pw,
        role="employee",  # Public signup cannot choose an administrator role
        is_active=True,
    )

    try:
        db.add(new_user)
        db.flush()

        # Audit: SIGNUP_SUCCESS
        rec = log_event(
            db,
            event_type=SIGNUP_SUCCESS,
            event_status=STATUS_SUCCESS,
            user_id=new_user.id,
            resource_type=RESOURCE_USER,
            resource_id=new_user.id,
            ip_address=client_ip,
            user_agent=user_agent,
        )
        if rec is None:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Security audit logging failed; signup aborted.",
            )
        db.commit()
        db.refresh(new_user)
    except IntegrityError as err:
        db.rollback()
        if is_email_unique_violation(err):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )
        logger.error("Integrity error while creating user: %s", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while creating your account.",
        )
    except SQLAlchemyError as err:
        db.rollback()
        logger.error("Database error while saving new user: %s", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while creating your account.",
        )

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and obtain JWT access token"
)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate an existing user.
    - Enforces rate limiting on authentication attempts.
    - Performs dummy Argon2 verification for nonexistent accounts to prevent timing attacks.
    - Returns generic error on invalid credentials to prevent email enumeration.
    - Checks that user account is active.
    - Generates and returns a signed JWT access token.
    """
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    if not login_rate_limiter.is_allowed(client_ip or "unknown"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )

    normalized_email = payload.email.strip().lower()

    try:
        user = (
            db.query(User)
            .filter(User.email == normalized_email)
            .first()
        )
    except SQLAlchemyError as err:
        logger.error("Database error during user login: %s", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while processing your request.",
        )

    # Thwart timing attacks via precomputed dummy Argon2 verification
    if user:
        is_password_valid = verify_password(payload.password, user.password_hash)
    else:
        verify_dummy_password(payload.password)
        is_password_valid = False

    if not is_password_valid:
        # Audit: LOGIN_FAILURE (no user_id — email enumeration prevention)
        log_event(
            db,
            event_type=LOGIN_FAILURE,
            event_status=STATUS_FAILURE,
            user_id=None,
            resource_type=RESOURCE_SESSION,
            ip_address=client_ip,
            user_agent=user_agent,
            details={"reason": "invalid_credentials"},
        )
        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        # Audit: ACCOUNT_INACTIVE_ACCESS
        log_event(
            db,
            event_type=ACCOUNT_INACTIVE_ACCESS,
            event_status=STATUS_DENIED,
            user_id=user.id,
            resource_type=RESOURCE_SESSION,
            ip_address=client_ip,
            user_agent=user_agent,
            details={"reason": "account_inactive"},
        )
        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive. Please contact an administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    # Audit: LOGIN_SUCCESS
    rec = log_event(
        db,
        event_type=LOGIN_SUCCESS,
        event_status=STATUS_SUCCESS,
        user_id=user.id,
        resource_type=RESOURCE_SESSION,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    if rec is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; login aborted.",
        )
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; login aborted.",
        )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile"
)
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve profile of the currently authenticated user using Bearer token.
    """
    return current_user
