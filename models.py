from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from extensions import db
from datetime import datetime, timezone
from flask_login import UserMixin

class User(db.Model, UserMixin):
    id:so.Mapped[int] = so.mapped_column(primary_key=True)
    first_name: so.Mapped[str] = so.mapped_column(sa.String(50), nullable=True)
    surname:so.Mapped[str] = so.mapped_column(sa.String(100), nullable=True)
    email:so.Mapped[str] = so.mapped_column(sa.String(254), nullable=False, index=True, unique=True)
    phone_number:so.Mapped[str] = so.mapped_column(sa.String(15), nullable=True, index=True, unique=True)
    password_hash:so.Mapped[Optional[str]] = so.mapped_column(sa.String(255))
    task: so.WriteOnlyMapped['Task'] = so.relationship(
        back_populates='author')


    def __repr__(self) -> str:
        return f'User {self.email}'
    
    def get_id(self):
        return str(self.id)

from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from extensions import db
from datetime import datetime, timezone
from flask_login import UserMixin

class Task(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('user.id'), nullable=False, index=True)
    description: so.Mapped[str] = so.mapped_column(sa.String(255))
    category: so.Mapped[str] = so.mapped_column(sa.String(100))
    completed: so.Mapped[bool] = so.mapped_column(sa.Boolean(), default=False)
    timestamp: so.Mapped[datetime] = so.mapped_column(index=True, default=lambda: datetime.now(timezone.utc))
    author: so.Mapped['User'] = so.relationship(back_populates='task')

    def __repr__(self) -> str:
        return f"Task {self.description}"

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'category': self.category,
            'completed': self.completed,
            'timestamp': self.timestamp.isoformat()
        }