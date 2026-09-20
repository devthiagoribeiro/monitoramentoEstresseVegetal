from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)
    profession: str | None = Field(default=None, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("O nome precisa ter pelo menos 2 caracteres.")
        return normalized

    @field_validator("phone", "profession")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class UserOut(ApiModel):
    id: int
    email: EmailStr
    name: str
    phone: str | None = None
    profession: str | None = None
    email_verified: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageOut(BaseModel):
    detail: str


class EmailRequest(BaseModel):
    email: EmailStr


class TokenRequest(BaseModel):
    token: str = Field(min_length=1)


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class FarmBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    address: str | None = None
    owner_name: str = Field(min_length=1, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=20)
    contact_email: EmailStr | None = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    address: str | None = None
    owner_name: str | None = Field(default=None, min_length=1, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=20)
    contact_email: EmailStr | None = None


class FarmOut(FarmBase, ApiModel):
    id: int
    manager: int

    @model_validator(mode="before")
    @classmethod
    def expose_manager_id(cls, value):
        if hasattr(value, "manager_id"):
            return {
                "id": value.id,
                "name": value.name,
                "address": value.address,
                "owner_name": value.owner_name,
                "contact_phone": value.contact_phone,
                "contact_email": value.contact_email,
                "manager": value.manager_id,
            }
        return value


class SensorCreate(BaseModel):
    mac_address: str = Field(min_length=1, max_length=50)
    farm: int
    description: str | None = None


class SensorUpdate(BaseModel):
    description: str | None = None


class SensorOut(ApiModel):
    id: int
    device: int
    mac_address: str
    farm: int
    description: str | None
    is_active: bool
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def flatten_relations(cls, value):
        if hasattr(value, "device"):
            return {
                "id": value.id,
                "device": value.device_id,
                "mac_address": value.device.mac_address,
                "farm": value.farm_id,
                "description": value.description,
                "is_active": value.is_active,
                "created_at": value.created_at,
            }
        return value


class ReadingCreate(BaseModel):
    mac_address: str
    timestamp: datetime
    dpv_kpa: float
    humidity: float
    temperature: float
    battery: float


class ReadingUpdate(BaseModel):
    dpv_kpa: float | None = None
    humidity: float | None = None
    temperature: float | None = None
    battery: float | None = None


class ReadingOut(ApiModel):
    id: int
    sensor: int
    timestamp: datetime
    dpv_kpa: float
    humidity: float
    temperature: float
    battery: float

    @model_validator(mode="before")
    @classmethod
    def expose_foreign_keys(cls, value):
        if hasattr(value, "sensor_id"):
            return {
                "id": value.id,
                "sensor": value.sensor_id,
                "timestamp": value.timestamp,
                "dpv_kpa": value.dpv_kpa,
                "humidity": value.humidity,
                "temperature": value.temperature,
                "battery": value.battery,
            }
        return value
