from datetime import datetime, timezone

import hmac

import jwt
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.dependencies import CurrentUser, DbSession
from app.mailer import send_password_reset_email, send_verification_email
from app.models import User
from app.schemas import (
    EmailRequest,
    LoginRequest,
    MessageOut,
    PasswordResetConfirm,
    TokenOut,
    TokenRequest,
    UserCreate,
    UserOut,
)
from app.security import (
    create_access_token,
    decode_email_verification_token,
    decode_password_reset_token,
    hash_password,
    password_reset_token_matches,
    verify_password,
)


router = APIRouter(prefix="/api/auth", tags=["autenticação"])


@router.post("/register/", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
@router.post("/register", response_model=MessageOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def register(payload: UserCreate, db: DbSession, background_tasks: BackgroundTasks) -> MessageOut:
    email = payload.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta com este e-mail.",
        )

    user = User(
        email=email,
        name=payload.name,
        phone=payload.phone,
        profession=payload.profession,
        password=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta com este e-mail.",
        ) from None
    db.refresh(user)
    background_tasks.add_task(send_verification_email, user.id, user.email, user.name)
    return MessageOut(detail="Conta criada. Enviamos um link de confirmação para o seu e-mail.")


@router.post("/login/", response_model=TokenOut)
def login(payload: LoginRequest, db: DbSession) -> TokenOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Confirme seu e-mail antes de entrar.",
        )
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/verify-email/", response_model=MessageOut)
def verify_email(payload: TokenRequest, db: DbSession) -> MessageOut:
    try:
        token_data = decode_email_verification_token(payload.token)
        user_id = int(token_data["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de confirmação inválido ou expirado.",
        ) from None

    user = db.get(User, user_id)
    if user is None or not hmac.compare_digest(
        user.email.encode(), str(token_data["email"]).encode()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de confirmação inválido ou expirado.",
        )
    if not user.email_verified:
        user.email_verified = True
        db.commit()
    return MessageOut(detail="E-mail confirmado. Você já pode entrar na sua conta.")


@router.post("/resend-verification/", response_model=MessageOut)
def resend_verification(
    payload: EmailRequest,
    db: DbSession,
    background_tasks: BackgroundTasks,
) -> MessageOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is not None and user.is_active and not user.email_verified:
        background_tasks.add_task(send_verification_email, user.id, user.email, user.name)
    return MessageOut(
        detail="Se existir uma conta pendente para este e-mail, enviaremos um novo link de confirmação."
    )


@router.post("/forgot-password/", response_model=MessageOut)
def forgot_password(
    payload: EmailRequest,
    db: DbSession,
    background_tasks: BackgroundTasks,
) -> MessageOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is not None and user.is_active:
        background_tasks.add_task(
            send_password_reset_email,
            user.id,
            user.email,
            user.name,
            user.password,
        )
    return MessageOut(
        detail="Se houver uma conta com este e-mail, enviaremos as instruções para redefinir a senha."
    )


@router.post("/reset-password/", response_model=MessageOut)
def reset_password(payload: PasswordResetConfirm, db: DbSession) -> MessageOut:
    try:
        token_data = decode_password_reset_token(payload.token)
        user_id = int(token_data["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de recuperação inválido ou expirado.",
        ) from None

    user = db.get(User, user_id)
    token_email = str(token_data["email"])
    if (
        user is None
        or not user.is_active
        or not hmac.compare_digest(user.email.encode(), token_email.encode())
        or not password_reset_token_matches(token_data, user.password)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de recuperação inválido ou expirado.",
        )

    user.password = hash_password(payload.new_password)
    user.email_verified = True
    db.commit()
    return MessageOut(detail="Senha redefinida. Você já pode entrar com a nova senha.")


@router.get("/me/", response_model=UserOut)
def me(current_user: CurrentUser) -> User:
    return current_user
