from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.dependencies import CurrentUser, DbSession
from app.models import AuthorizedDevice, Farm, Reading, Sensor
from app.schemas import (
    FarmCreate,
    FarmOut,
    FarmUpdate,
    ReadingCreate,
    ReadingOut,
    ReadingUpdate,
    SensorCreate,
    SensorOut,
    SensorUpdate,
)


router = APIRouter(prefix="/api/devices", tags=["dispositivos"])


def owned_farm(db: DbSession, farm_id: int, user_id: int) -> Farm:
    farm = db.scalar(select(Farm).where(Farm.id == farm_id, Farm.manager_id == user_id))
    if farm is None:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada.")
    return farm


def owned_sensor(db: DbSession, sensor_id: int, user_id: int) -> Sensor:
    sensor = db.scalar(
        select(Sensor)
        .options(joinedload(Sensor.device))
        .join(Sensor.farm)
        .where(Sensor.id == sensor_id, Farm.manager_id == user_id)
    )
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor não encontrado.")
    return sensor


def owned_reading(db: DbSession, reading_id: int, user_id: int) -> Reading:
    reading = db.scalar(
        select(Reading)
        .join(Reading.farm)
        .where(Reading.id == reading_id, Farm.manager_id == user_id)
    )
    if reading is None:
        raise HTTPException(status_code=404, detail="Leitura não encontrada.")
    return reading


@router.get("/farms/", response_model=list[FarmOut])
def list_farms(db: DbSession, current_user: CurrentUser) -> list[Farm]:
    statement = select(Farm).where(Farm.manager_id == current_user.id).order_by(Farm.id)
    return list(db.scalars(statement))


@router.post("/farms/", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
def create_farm(payload: FarmCreate, db: DbSession, current_user: CurrentUser) -> Farm:
    farm = Farm(**payload.model_dump(), manager_id=current_user.id)
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/farms/{farm_id}/", response_model=FarmOut)
def get_farm(farm_id: int, db: DbSession, current_user: CurrentUser) -> Farm:
    return owned_farm(db, farm_id, current_user.id)


@router.api_route("/farms/{farm_id}/", methods=["PUT", "PATCH"], response_model=FarmOut)
def update_farm(
    farm_id: int, payload: FarmUpdate, db: DbSession, current_user: CurrentUser
) -> Farm:
    farm = owned_farm(db, farm_id, current_user.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(farm, key, value)
    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/farms/{farm_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(farm_id: int, db: DbSession, current_user: CurrentUser) -> Response:
    farm = owned_farm(db, farm_id, current_user.id)
    for sensor in farm.sensors:
        sensor.device.is_used = False
    db.delete(farm)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/sensors/", response_model=list[SensorOut])
def list_sensors(db: DbSession, current_user: CurrentUser) -> list[Sensor]:
    statement = (
        select(Sensor)
        .options(joinedload(Sensor.device))
        .join(Sensor.farm)
        .where(Farm.manager_id == current_user.id)
        .order_by(Sensor.id)
    )
    return list(db.scalars(statement))


@router.post("/sensors/", response_model=SensorOut, status_code=status.HTTP_201_CREATED)
def create_sensor(payload: SensorCreate, db: DbSession, current_user: CurrentUser) -> Sensor:
    owned_farm(db, payload.farm, current_user.id)
    device = db.scalar(
        select(AuthorizedDevice).where(
            func.lower(AuthorizedDevice.mac_address) == payload.mac_address.strip().lower()
        ).with_for_update()
    )
    if device is None:
        raise HTTPException(
            status_code=400,
            detail={"mac_address": "Este sensor não está na lista de dispositivos autorizados."},
        )
    if device.is_used:
        raise HTTPException(
            status_code=409,
            detail={"is_used": "Este sensor já está em uso por outra fazenda."},
        )
    sensor = Sensor(
        device=device,
        farm_id=payload.farm,
        description=payload.description,
        is_active=payload.is_active,
    )
    device.is_used = True
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.get("/sensors/{sensor_id}/", response_model=SensorOut)
def get_sensor(sensor_id: int, db: DbSession, current_user: CurrentUser) -> Sensor:
    return owned_sensor(db, sensor_id, current_user.id)


@router.api_route("/sensors/{sensor_id}/", methods=["PUT", "PATCH"], response_model=SensorOut)
def update_sensor(
    sensor_id: int, payload: SensorUpdate, db: DbSession, current_user: CurrentUser
) -> Sensor:
    sensor = owned_sensor(db, sensor_id, current_user.id)
    data = payload.model_dump(exclude_unset=True)
    if "farm" in data:
        owned_farm(db, data["farm"], current_user.id)
        sensor.farm_id = data.pop("farm")
    for key, value in data.items():
        setattr(sensor, key, value)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.delete("/sensors/{sensor_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_sensor(sensor_id: int, db: DbSession, current_user: CurrentUser) -> Response:
    sensor = owned_sensor(db, sensor_id, current_user.id)
    sensor.device.is_used = False
    db.delete(sensor)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/readings/", response_model=list[ReadingOut])
def list_readings(db: DbSession, current_user: CurrentUser) -> list[Reading]:
    statement = (
        select(Reading)
        .join(Reading.farm)
        .where(Farm.manager_id == current_user.id)
        .order_by(Reading.timestamp.desc())
    )
    return list(db.scalars(statement))


@router.post("/readings/", response_model=ReadingOut, status_code=status.HTTP_201_CREATED)
def create_reading(payload: ReadingCreate, db: DbSession, current_user: CurrentUser) -> Reading:
    sensor = owned_sensor(db, payload.sensor, current_user.id)
    values = payload.model_dump(exclude={"sensor"})
    reading = Reading(**values, sensor_id=sensor.id, farm_id=sensor.farm_id)
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/readings/{reading_id}/", response_model=ReadingOut)
def get_reading(reading_id: int, db: DbSession, current_user: CurrentUser) -> Reading:
    return owned_reading(db, reading_id, current_user.id)


@router.api_route("/readings/{reading_id}/", methods=["PUT", "PATCH"], response_model=ReadingOut)
def update_reading(
    reading_id: int, payload: ReadingUpdate, db: DbSession, current_user: CurrentUser
) -> Reading:
    reading = owned_reading(db, reading_id, current_user.id)
    data = payload.model_dump(exclude_unset=True)
    if "sensor" in data:
        sensor = owned_sensor(db, data.pop("sensor"), current_user.id)
        reading.sensor_id = sensor.id
        reading.farm_id = sensor.farm_id
    for key, value in data.items():
        setattr(reading, key, value)
    db.commit()
    db.refresh(reading)
    return reading


@router.delete("/readings/{reading_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_reading(reading_id: int, db: DbSession, current_user: CurrentUser) -> Response:
    reading = owned_reading(db, reading_id, current_user.id)
    db.delete(reading)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
