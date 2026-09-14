import importlib
import os
import sys
from pathlib import Path


def load_system_status():
    sandbox = os.environ.get("JIRAIYA_SANDBOX")

    if not sandbox:
        sandbox = str(
            Path(__file__).resolve().parent / "multi_chunk_test"
        )

    module_path = Path(sandbox) / "self_improvement"

    sys.path.insert(0, str(module_path))

    return importlib.import_module("system_status")


def test_required_functions(module):
    required = [
        "check_memory",
        "check_knowledge",
        "check_web",
        "check_llm",
        "get_system_status",
    ]

    for name in required:
        assert hasattr(
            module,
            name
        ), f"Missing function: {name}"


def test_component_results(module):
    checks = [
        "check_memory",
        "check_knowledge",
        "check_web",
        "check_llm",
    ]

    for name in checks:
        result = getattr(module, name)()

        assert result is not None, (
            f"{name}() returned None"
        )


def test_aggregate_status(module):
    result = module.get_system_status()

    assert isinstance(
        result,
        dict
    ), "get_system_status() must return a dict"

    required = {
        "memory",
        "knowledge",
        "web",
        "llm",
    }

    missing = required - set(result)

    assert not missing, (
        f"Missing status components: {sorted(missing)}"
    )


def main():
    module = load_system_status()

    test_required_functions(module)
    print("✓ Required functions")

    test_component_results(module)
    print("✓ Component results")

    test_aggregate_status(module)
    print("✓ Aggregate status")

    print()
    print("BEHAVIORAL TEST: PASS")


if __name__ == "__main__":
    main()
