import os
from datetime import datetime, timezone
from fastapi.testclient import TestClient

import fairgraph.openminds.core as omcore
import fairgraph.openminds.controlledterms as omterms

from ..main import app
from ..auth import get_kg_client_for_user_account

import pytest

client = TestClient(app)
token = os.environ["VF_TEST_TOKEN"]
AUTH_HEADER = {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def private_model():
    kg_client = get_kg_client_for_user_account(token)
    test_model = omcore.Model(
        name="TestModel API v2.5",
        alias="TestModel-API-v2.5",
        abstraction_level=omterms.ModelAbstractionLevel.by_name("spiking neurons: biophysical", kg_client),
        custodians=omcore.Person(given_name="Frodo", family_name="Baggins"),
        description="This is not a real model, it is an entry created by automated tests, and will be deleted.",
        developers=[omcore.Person(given_name="Frodo", family_name="Baggins"),
                    omcore.Person(given_name="Tom", family_name="Bombadil")],
        digital_identifier=None,
        versions=None,
        homepage=None,
        how_to_cite=None,
        model_scope=omterms.ModelScope.by_name("network: microcircuit", kg_client),
        study_targets=[
            omterms.Species.by_name("Callithrix jacchus", kg_client),
            omterms.UBERONParcellation.by_name("CA1 field of hippocampus", kg_client),
            omterms.CellType.by_name("hippocampus CA1 pyramidal neuron", kg_client)
        ]
    )
    test_model.save(kg_client, space="myspace")
    return test_model


@pytest.fixture(scope="session")
def released_model():
    kg_client = get_kg_client_for_user_account(token)
    released_model = omcore.Model.from_id("cb62b56e-bdfa-4016-81cd-c9dbc834cebc", kg_client)
    assert isinstance(released_model, omcore.Model)
    return released_model


def _build_sample_model():
    now = datetime.now(timezone.utc)
    return {
        "name": f"TestModel API v2 {now.isoformat()}",
        "alias": f"TestModel-APIv2-{now.isoformat()}",
        "author": [
            {"given_name": "Frodo", "family_name": "Baggins"},
            {"given_name": "Tom", "family_name": "Bombadil"},
        ],
        "owner": [{"given_name": "Frodo", "family_name": "Baggins"}],
        "project_id": "model-validation",
        "organization": "HBP-SGA3-WP5",
        "private": True,
        "species": "Ornithorhynchus anatinus",
        "brain_region": "hippocampus",
        "model_scope": "network",
        "abstraction_level": "spiking neurons: point neuron",
        "cell_type": None,
        "description": "description goes here",
        "images": [{"caption": "Figure 1", "url": "http://example.com/figure_1.png"}],
        "instances": [
            {
                "version": "1.23",
                "description": "description of this version",
                "parameters": "{'meaning': 42}",
                "code_format": "Python",
                "source": "http://example.com/my_code.py",
                "license": "MIT",
            }
        ],
    }


def _build_sample_validation_test():
    now = datetime.now(timezone.utc)
    return {
        "name": f"TestValidationTestDefinition API v2 {now.isoformat()}",
        "alias": f"TestValidationTestDefinition-APIv2-{now.isoformat()}",
        "author": [
            {"given_name": "Frodo", "family_name": "Baggins"},
            {"given_name": "Tom", "family_name": "Bombadil"},
        ],
        "implementation_status": "proposal",
        "species": "Mus musculus",
        "brain_region": "hippocampus",
        "cell_type": "hippocampus CA1 pyramidal cell",
        "description": "description goes here",
        "data_location": ["http://example.com/my_data.csv"],
        "data_type": "csv",
        "recording_modality": "electrophysiology",
        "test_type": "single cell activity",
        "score_type": "z-score",
        "instances": [
            {
                "version": "1.23",
                "description": "description of this version",
                "parameters": "{'meaning': 42}",
                "path": "mylib.tests.MeaningOfLifeTest",
                "repository": "http://example.com/my_code.py",
            }
        ],
    }


def _build_sample_result(model_instance_id, test_instance_id):
    now = datetime.now(timezone.utc)
    return {
        "model_instance_id": model_instance_id,
        "test_instance_id": test_instance_id,
        "results_storage": [
            {
                "download_url": f"http://example.com/validation_result_{now.strftime('%Y%m%d-%H%M%S')}"
            },
            {
                "file_store": "drive",
                "local_path": "/spiketrainsx2.h5",
                "id": "adavison"
            }
        ],
        "score": 0.1234,
        "passed": True,
        "project_id": "model-validation",
        "normalized_score": 0.2468,
    }
