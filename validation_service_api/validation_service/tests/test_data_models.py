import sys
from unittest.mock import patch, MagicMock

sys.path.append(".")

import fairgraph.openminds.core as omcore
import validation_service.auth  # import before patching so patch.object can target it
import validation_service.examples

EXAMPLES = validation_service.examples.EXAMPLES

ID_PREFIX = "https://kg.ebrains.eu/api/instances"

# data_models.py calls get_term_cache() at module level, which calls:
#   - cls.instances() for 11 of the 12 term classes (pre-defined data, no KG call)
#   - cls.list(kg_service_client, ...) for omcore.Organization (needs KG)
# We also mock get_kg_client_for_service_account so KGClient() doesn't fail with
# missing env vars. Patches are stopped after import; term_cache is already populated.
_patcher_auth = patch.object(
    validation_service.auth, "get_kg_client_for_service_account", return_value=MagicMock()
)
_patcher_org = patch.object(omcore.Organization, "list", return_value=[])

_patcher_auth.start()
_patcher_org.start()

from validation_service.data_models import (  # noqa: E402
    ScientificModel,
    ValidationTest,
    ValidationTestInstance,
    ValidationResult,
)

_patcher_auth.stop()
_patcher_org.stop()


class MockKGResult:
    data = []


class MockKGClient:

    def uri_from_uuid(self, uuid):
        return f"{ID_PREFIX}/{uuid}"

    def uuid_from_uri(self, uri):
        return uri.split("/")[-1]

    def retrieve_query(self, query_label):
        return {"@id": "not_a_real_id", "query_label": query_label}

    def query(
        self, query, filter=None, space=None, from_index=0, size=100, release_status="released"
    ):
        return MockKGResult()


class TestScientificModel:

    def test_parse_example(self):
        ScientificModel(**EXAMPLES["ScientificModel"])


class TestValidationTest:

    def test_parse_example(self):
        ValidationTest(**EXAMPLES["ValidationTest"])


class TestValidationTestInstance:

    def test_parse_example(self):
        ValidationTestInstance(**EXAMPLES["ValidationTestInstance"])


class TestValidationResult:

    def test_parse_example(self):
        ValidationResult(**EXAMPLES["ValidationResult"])
