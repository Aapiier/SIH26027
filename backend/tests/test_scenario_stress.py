"""
RailSync AI — Automated Scenario Stress & Reliability Test Suite
Automates execution and invariant verification across all 10 operational stress scenarios:
1. SCN-01: Mega Block (Multi-Department Bundling & Track NoOverlap)
2. SCN-02: Safety-Critical Escalation (Tier 1 Emergency Gate Precedence)
3. SCN-03: Freight Squeeze (Dense Traffic Window Shrinking)
4. SCN-04: Heavy Machinery Transit Conflict (Disjunctive Routing & Negative Audit)
5. SCN-05: Power Block Isolation (TRD 25kV AC Traction Coordination)
6. SCN-06: Train Delay Disruption & Warm-Start Re-optimization
7. SCN-07: No Feasible Window Handling (Graceful Infeasibility Diagnosis)
8. SCN-08: Resource Starvation (Machinery Limit Respect & Bottleneck Explanation)
9. SCN-09: Bundle Compatibility (Valid Grouping & Incompatible Isolation)
10. SCN-10: Horizon Boundary & Exact-Fit Gaps (Edge Window Retention)
"""

import pytest
from backend.app.pipeline.scenario_runner import ScenarioRunner


@pytest.fixture(scope="module")
def runner():
    return ScenarioRunner(random_seed=42)


def test_scenario_1_mega_block(runner: ScenarioRunner):
    res = runner.run_scenario_1_mega_block()
    assert res["passed"] is True, f"SCN-01 failed: {res}"
    assert res["validator_verdict"] == "PASSED"
    assert res["bundles_count"] >= 1
    assert res["cross_dept_bundles_count"] >= 1
    assert res["scheduled_tasks_count"] > 0


def test_scenario_2_safety_critical_escalation(runner: ScenarioRunner):
    res = runner.run_scenario_2_safety_critical_escalation()
    assert res["passed"] is True, f"SCN-02 failed: {res}"
    assert res["emergency_scheduled"] is True
    assert res["emergency_priority_score"] >= 95.0
    assert res["validator_verdict"] == "PASSED"


def test_scenario_3_freight_squeeze(runner: ScenarioRunner):
    res = runner.run_scenario_3_freight_squeeze()
    assert res["passed"] is True, f"SCN-03 failed: {res}"
    assert res["validator_verdict"] == "PASSED"


def test_scenario_4_machinery_transit_conflict(runner: ScenarioRunner):
    res = runner.run_scenario_4_machinery_transit_conflict()
    assert res["passed"] is True, f"SCN-04 failed: {res}"
    assert res["solver_plan_verdict"] == "PASSED"
    assert res["negative_test_caught"] is True
    assert res["conflicts_flagged"] >= 1


def test_scenario_5_power_block_isolation(runner: ScenarioRunner):
    res = runner.run_scenario_5_power_block_isolation()
    assert res["passed"] is True, f"SCN-05 failed: {res}"
    assert res["validator_verdict"] == "PASSED"


def test_scenario_6_train_delay_disruption(runner: ScenarioRunner):
    res = runner.run_scenario_6_train_delay_disruption()
    assert res["passed"] is True, f"SCN-06 failed: {res}"
    assert res["validator_verdict"] == "PASSED"
    assert res["reoptimization_runtime_s"] < 5.0


def test_scenario_7_no_feasible_window(runner: ScenarioRunner):
    res = runner.run_scenario_7_no_feasible_window()
    assert res["passed"] is True, f"SCN-07 failed: {res}"
    assert res["task_status"] == "UNSCHEDULED"
    assert res["validator_verdict"] == "PASSED"
    assert res["diagnostic_root_cause"] is not None


def test_scenario_8_resource_starvation(runner: ScenarioRunner):
    res = runner.run_scenario_8_resource_starvation()
    assert res["passed"] is True, f"SCN-08 failed: {res}"
    assert res["validator_verdict"] == "PASSED"


def test_scenario_9_bundle_compatibility(runner: ScenarioRunner):
    res = runner.run_scenario_9_bundle_compatibility()
    assert res["passed"] is True, f"SCN-09 failed: {res}"
    assert res["validator_verdict"] == "PASSED"
    assert res["bundles_count"] >= 1


def test_scenario_10_horizon_boundary_gaps(runner: ScenarioRunner):
    res = runner.run_scenario_10_horizon_boundary_gaps()
    assert res["passed"] is True, f"SCN-10 failed: {res}"
    assert res["validator_verdict"] == "PASSED"
    assert res["scheduled_tasks"] > 0
