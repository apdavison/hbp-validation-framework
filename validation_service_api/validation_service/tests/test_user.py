"""
Tests of the User class

Note: These will fail if the test user's permissions are too elevated.
"""

import base64
import json
import os
from unittest.mock import AsyncMock, MagicMock

from fastapi.security import HTTPAuthorizationCredentials
import pytest

from ..auth import User
from .fixtures import requires_token



token = HTTPAuthorizationCredentials(
    credentials=os.environ.get("VF_TEST_TOKEN", ""), scheme="Bearer"
)


def _make_token(payload: dict) -> HTTPAuthorizationCredentials:
    """Build a syntactically-valid JWT whose payload decodes to the given dict.
    Not signed — only suitable for tests that exercise _decode_jwt_payload."""
    def b64(b: bytes) -> str:
        return base64.urlsafe_b64encode(b).rstrip(b"=").decode()
    header = b64(b'{"alg":"none","typ":"JWT"}')
    body = b64(json.dumps(payload).encode())
    return HTTPAuthorizationCredentials(
        scheme="Bearer", credentials=f"{header}.{body}.sig"
    )


@pytest.mark.asyncio
@requires_token
async def test_user__is_admin():
    user = User(token, allow_anonymous=False)
    is_admin = await user.is_admin()
    assert not is_admin


@pytest.mark.asyncio
@requires_token
async def test_user_teams():
    user = User(token, allow_anonymous=False)
    teams = await user.get_teams()
    assert "collab-model-validation-administrator" not in teams


@pytest.mark.asyncio
@requires_token
async def test_get_collab_permissions():
    user = User(token, allow_anonymous=False)
    permissions = await user.get_collab_permissions("model-validation")
    assert permissions == {
        "UPDATE": False,
        "VIEW": True,
    }


@pytest.mark.asyncio
@requires_token
async def test_can_view_collab():
    user = User(token, allow_anonymous=False)
    can_view = await user.can_view_collab("model-validation")
    assert can_view


@pytest.mark.asyncio
@requires_token
async def test_can_edit_collab():
    user = User(token, allow_anonymous=False)
    can_edit = await user.can_edit_collab("model-validation")
    assert not can_edit


# --- Unit tests for group-based role resolution (no live IDM calls) ---


def test_get_groups_from_jwt():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice",
                     "group": ["unit-x", "unit-y"]}),
        allow_anonymous=False,
    )
    assert user.get_groups() == {"unit-x", "unit-y"}


def test_get_groups_absent_claim_returns_empty_set():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice"}),
        allow_anonymous=False,
    )
    assert user.get_groups() == set()


def _mock_client(*, json_data=None, status_code=200):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or []
    resp.raise_for_status = MagicMock()
    client = MagicMock()
    client.get = AsyncMock(return_value=resp)
    return client


@pytest.mark.asyncio
async def test_has_role_via_group_matches():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice",
                     "group": ["unit-x"]}),
        allow_anonymous=False,
    )
    client = _mock_client(json_data=[{"name": "unit-x"}, {"name": "other"}])
    assert await user._has_role_via_group("administrator", "foo", client) is True


@pytest.mark.asyncio
async def test_has_role_via_group_no_intersection():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice",
                     "group": ["unit-z"]}),
        allow_anonymous=False,
    )
    client = _mock_client(json_data=[{"name": "unit-x"}])
    assert await user._has_role_via_group("administrator", "foo", client) is False


@pytest.mark.asyncio
async def test_has_role_via_group_empty_groups_skips_call():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice"}),
        allow_anonymous=False,
    )
    client = _mock_client()
    assert await user._has_role_via_group("administrator", "foo", client) is False
    client.get.assert_not_called()


@pytest.mark.asyncio
async def test_has_role_via_group_404_returns_false():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice",
                     "group": ["unit-x"]}),
        allow_anonymous=False,
    )
    client = _mock_client(status_code=404)
    assert await user._has_role_via_group("administrator", "foo", client) is False


@pytest.mark.asyncio
async def test_user_has_role_direct_only():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice"}),
        allow_anonymous=False,
    )
    user._has_direct_role = AsyncMock(return_value=True)
    user._has_role_via_group = AsyncMock(return_value=False)
    assert await user._has_role("administrator", "foo", MagicMock()) is True


@pytest.mark.asyncio
async def test_user_has_role_via_group_only():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice",
                     "group": ["unit-x"]}),
        allow_anonymous=False,
    )
    user._has_direct_role = AsyncMock(return_value=False)
    user._has_role_via_group = AsyncMock(return_value=True)
    assert await user._has_role("administrator", "foo", MagicMock()) is True


@pytest.mark.asyncio
async def test_user_has_role_neither():
    user = User(
        _make_token({"sub": "1", "preferred_username": "alice"}),
        allow_anonymous=False,
    )
    user._has_direct_role = AsyncMock(return_value=False)
    user._has_role_via_group = AsyncMock(return_value=False)
    assert await user._has_role("administrator", "foo", MagicMock()) is False
