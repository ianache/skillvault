import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
SKILLS = SKILL.parent
for p in (str(SKILL), str(HERE)):
    if p not in sys.path:
        sys.path.insert(0, p)

import pytest  # noqa: E402

import kbfactory  # noqa: E402


@pytest.fixture
def model():
    return kbfactory.base_model()


@pytest.fixture
def make_kb(tmp_path):
    def _make(m):
        return kbfactory.write_kb(tmp_path, m)
    return _make


@pytest.fixture
def skills_dir():
    return SKILLS
