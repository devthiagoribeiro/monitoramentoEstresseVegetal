from sqlalchemy import func, select
from sqlalchemy.orm import joinedload, Session
from app.database import get_db
from app.dependencies import CurrentUser, DbSession
from app.models import AuthorizedDevice, Reading, Sensor

db: Session = next(get_db())
stmt = select(Sensor).join(Sensor.device).where(AuthorizedDevice.mac_address == "A-0001").where(Sensor.is_active == False)


print(db.scalars(stmt).first().id)

