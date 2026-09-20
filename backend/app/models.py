from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


IdType = BigInteger().with_variant(Integer, "sqlite")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    # Os nomes das tabelas Django são mantidos para preservar os dados existentes.
    __tablename__ = "users_user"

    id: Mapped[int] = mapped_column(IdType, primary_key=True, autoincrement=True)
    password: Mapped[str] = mapped_column(String(128))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    profession: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False)
    date_joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    farms: Mapped[list["Farm"]] = relationship(back_populates="manager", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "devices_farm"

    id: Mapped[int] = mapped_column(IdType, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_name: Mapped[str] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users_user.id"), index=True)

    manager: Mapped[User] = relationship(back_populates="farms")
    sensors: Mapped[list["Sensor"]] = relationship(back_populates="farm", cascade="all, delete-orphan")


class AuthorizedDevice(Base):
    __tablename__ = "devices_authorizeddevice"

    id: Mapped[int] = mapped_column(IdType, primary_key=True, autoincrement=True)
    mac_address: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    installations: Mapped[list["Sensor"]] = relationship(back_populates="device")


class Sensor(Base):
    __tablename__ = "devices_sensor"

    id: Mapped[int] = mapped_column(IdType, primary_key=True, autoincrement=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    farm_id: Mapped[int] = mapped_column(ForeignKey("devices_farm.id"), index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices_authorizeddevice.id"), index=True)

    farm: Mapped[Farm] = relationship(back_populates="sensors")
    device: Mapped[AuthorizedDevice] = relationship(back_populates="installations")
    readings: Mapped[list["Reading"]] = relationship(back_populates="sensor", cascade="all, delete-orphan")


class Reading(Base):
    __tablename__ = "devices_reading"

    id: Mapped[int] = mapped_column(IdType, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    dpv_kpa: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    temperature: Mapped[float] = mapped_column(Float)
    battery: Mapped[float] = mapped_column(Float)
    sensor_id: Mapped[int] = mapped_column(ForeignKey("devices_sensor.id"), index=True)

    sensor: Mapped[Sensor] = relationship(back_populates="readings")
