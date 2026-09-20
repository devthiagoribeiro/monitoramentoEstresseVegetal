"""Preserva instalações de sensores e normaliza leituras.

Revision ID: 20260920_01
Revises:
Create Date: 2026-09-20
"""

from alembic import op
from sqlalchemy import inspect


revision = "20260920_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "devices_reading" in tables:
        columns = {column["name"] for column in inspector.get_columns("devices_reading")}
        if "farm_id" in columns:
            for foreign_key in inspector.get_foreign_keys("devices_reading"):
                if foreign_key.get("constrained_columns") == ["farm_id"] and foreign_key.get("name"):
                    op.drop_constraint(
                        foreign_key["name"],
                        "devices_reading",
                        type_="foreignkey",
                    )
            for index in inspector.get_indexes("devices_reading"):
                if index.get("column_names") == ["farm_id"] and index.get("name"):
                    op.drop_index(index["name"], table_name="devices_reading")
            op.drop_column("devices_reading", "farm_id")

    if "devices_sensor" in tables:
        for constraint in inspector.get_unique_constraints("devices_sensor"):
            if constraint.get("column_names") == ["device_id"] and constraint.get("name"):
                op.drop_constraint(
                    constraint["name"],
                    "devices_sensor",
                    type_="unique",
                )


def downgrade() -> None:
    raise RuntimeError(
        "Esta migração é irreversível após um dispositivo possuir múltiplas instalações históricas."
    )

