import argparse
import getpass

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import AuthorizedDevice, User
from app.security import hash_password


def create_user(email: str, name: str, password: str, staff: bool) -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        normalized_email = email.strip().lower()
        if db.scalar(select(User).where(User.email == normalized_email)):
            raise SystemExit("Já existe um usuário com este e-mail.")
        db.add(
            User(
                email=normalized_email,
                name=name,
                password=hash_password(password),
                email_verified=True,
                is_staff=staff,
                is_superuser=staff,
            )
        )
        db.commit()
    print(f"Usuário {normalized_email} criado.")


def authorize_device(mac_address: str) -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        normalized_mac = mac_address.strip().upper()
        if db.scalar(
            select(AuthorizedDevice).where(AuthorizedDevice.mac_address == normalized_mac)
        ):
            raise SystemExit("Este dispositivo já está autorizado.")
        db.add(AuthorizedDevice(mac_address=normalized_mac))
        db.commit()
    print(f"Dispositivo {normalized_mac} autorizado.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Administração da API")
    subparsers = parser.add_subparsers(dest="command", required=True)
    command = subparsers.add_parser("create-user")
    command.add_argument("--email", required=True)
    command.add_argument("--name", required=True)
    command.add_argument("--staff", action="store_true")
    device_command = subparsers.add_parser("authorize-device")
    device_command.add_argument("--mac-address", required=True)
    args = parser.parse_args()
    if args.command == "create-user":
        create_user(args.email, args.name, getpass.getpass("Senha: "), args.staff)
    elif args.command == "authorize-device":
        authorize_device(args.mac_address)


if __name__ == "__main__":
    main()
