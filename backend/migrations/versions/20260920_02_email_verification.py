"""Adiciona o estado de verificação de e-mail.

Revision ID: 20260920_02
Revises: 20260920_01
Create Date: 2026-09-20
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision = "20260920_02"
down_revision = "20260920_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "users_user" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("users_user")}
    if "email_verified" in columns:
        return

    # Contas anteriores à verificação continuam podendo entrar. Novas contas
    # são criadas como não verificadas pela aplicação.
    op.add_column(
        "users_user",
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("users_user", "email_verified", server_default=sa.false())


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "users_user" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("users_user")}
    if "email_verified" in columns:
        op.drop_column("users_user", "email_verified")
