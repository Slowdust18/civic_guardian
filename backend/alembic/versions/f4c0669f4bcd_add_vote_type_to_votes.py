"""Add vote_type to votes

Revision ID: f4c0669f4bcd
Revises: 1e452bb0d4d7
Create Date: 2025-09-19 10:50:34.934637

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4c0669f4bcd'
down_revision: Union[str, Sequence[str], None] = '1e452bb0d4d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
