import argparse
import getpass
import sys

from app.database import SessionLocal
from app.models import User
from app.security import hash_password


def main():
    parser = argparse.ArgumentParser(
        description="Controlled CLI for provisioning or promoting an Administrator account."
    )
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--name", required=True, help="Administrator full name")
    parser.add_argument("--password", required=False, help="Password (interactive prompt if omitted)")

    args = parser.parse_args()

    email = args.email.strip().lower()
    full_name = " ".join(args.name.split())
    password = args.password

    if not password:
        password = getpass.getpass("Enter administrator password (min 8 chars): ")
        password_confirm = getpass.getpass("Confirm password: ")
        if password != password_confirm:
            print("Error: Passwords do not match.")
            sys.exit(1)

    if len(password) < 8 or len(password) > 128 or not password.strip():
        print("Error: Password must be between 8 and 128 non-whitespace characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            if user.role == "admin":
                print(f"User '{email}' is already an administrator.")
                return
            confirm = input(f"User '{email}' exists with role '{user.role}'. Promote to admin? [y/N]: ")
            if confirm.strip().lower() == "y":
                user.role = "admin"
                db.commit()
                print(f"Successfully promoted '{email}' to administrator.")
            else:
                print("Operation aborted.")
            return

        new_admin = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )
        db.add(new_admin)
        db.commit()
        print(f"Successfully created administrator account for '{email}'.")
    except Exception as e:
        db.rollback()
        print(f"Error provisioning administrator: {type(e).__name__}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
