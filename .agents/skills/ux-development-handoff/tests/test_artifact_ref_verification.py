"""El artifact_ref de Stitch no se escribe de memoria: debe tener la forma real y aparecer literal en una salida de herramienta guardada.

Incidente (2026-10-04): se registró un id con el prefijo real y un sufijo inventado. Tenía la forma correcta, así que solo
la prueba contra una evidencia detecta que no existe.
"""
import pytest

from validators import codes, registry
from validators.okf import load_kb

DTM, SCR, STP = "DTM-CL2-TENANT-001", "SCR-021", "STP-CL2-TENANT-001"
REAL_ID = "d5465d68fc1546fbb011c7841a9c7a9b"
INVENTED_ID = "d5465d68fc3e4ab6b1a5eab2a7d4f1a0"  # mismo prefijo de 8 caracteres, resto inventado
REF = f"projects/123/screens/{REAL_ID}"


@pytest.fixture
def real_model(model):
    model["stp"][0]["external_ref"] = "projects/123"
    return model


def _evidence(tmp_path, text=None):
    p = tmp_path / "list_screens.json"
    p.write_text(text if text is not None else f'{{"screens":[{{"name":"projects/123/screens/{REAL_ID}"}}]}}', encoding="utf-8")
    return str(p)


def _register(kb, ref, evidence=None):
    registry.register_exploration(kb, DTM, SCR, STP, ref, "v1", evidence=evidence)


def test_malformed_ref_is_rejected(real_model, make_kb, tmp_path):
    kb = make_kb(real_model)
    for bad in ("screens/" + REAL_ID, f"projects/123/screens/{REAL_ID[:-1]}", f"projects/123/screens/{REAL_ID.upper()}", "projects/abc/screens/" + REAL_ID):
        with pytest.raises(registry.RegistryError, match=codes.INVALID_ARTIFACT_REF):
            _register(kb, bad, _evidence(tmp_path))


def test_well_formed_ref_without_evidence_is_rejected(real_model, make_kb):
    with pytest.raises(registry.RegistryError, match=codes.UNVERIFIED_ARTIFACT_REF):
        _register(make_kb(real_model), REF)


def test_ref_missing_from_the_evidence_is_rejected(real_model, make_kb, tmp_path):
    with pytest.raises(registry.RegistryError, match=codes.UNVERIFIED_ARTIFACT_REF):
        _register(make_kb(real_model), REF, _evidence(tmp_path, '{"screens":[]}'))


def test_invented_suffix_with_a_real_prefix_is_rejected(real_model, make_kb, tmp_path):
    invented = f"projects/123/screens/{INVENTED_ID}"
    with pytest.raises(registry.RegistryError, match=codes.UNVERIFIED_ARTIFACT_REF):
        _register(make_kb(real_model), invented, _evidence(tmp_path))


def test_missing_evidence_file_is_rejected(real_model, make_kb, tmp_path):
    with pytest.raises(registry.RegistryError, match=codes.UNVERIFIED_ARTIFACT_REF):
        _register(make_kb(real_model), REF, str(tmp_path / "no-existe.json"))


def test_ref_from_another_stitch_project_is_rejected(real_model, make_kb, tmp_path):
    other = f"projects/999/screens/{REAL_ID}"
    with pytest.raises(registry.RegistryError, match=codes.INVALID_ARTIFACT_REF):
        _register(make_kb(real_model), other, _evidence(tmp_path, f'{{"name":"{other}"}}'))


def test_verified_ref_is_registered_with_its_evidence(real_model, make_kb, tmp_path):
    kb = make_kb(real_model)
    _register(kb, REF, _evidence(tmp_path))
    e = next(x for x in load_kb(kb).dtm_entries() if x["screen"] == SCR)
    assert e["exploration_design"]["artifact_ref"] == REF
    assert e["exploration_design"]["evidence"] == "list_screens.json"


def test_placeholder_refs_stay_exempt(real_model, make_kb):
    kb = make_kb(real_model)
    _register(kb, "PLACEHOLDER:artifact-x")
    e = next(x for x in load_kb(kb).dtm_entries() if x["screen"] == SCR)
    assert e["exploration_design"]["artifact_ref"] == "PLACEHOLDER:artifact-x"
