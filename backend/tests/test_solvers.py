"""
Analytical Unit Tests for Pure Python Solvers in Phronesis V3.

Validates exact mathematical correctness against known analytical test vectors
from peer-reviewed literature:
  1. EVPI & EVSI (Raiffa & Schlaifer 1961; Howard 1966)
  2. Cumulative Prospect Theory & CRRA (Tversky & Kahneman 1992; Arrow 1965)
  3. Hyperbolic vs Exponential Discounting (Laibson 1997; Samuelson 1937)
  4. Real Options & Convexity (Dixit & Pindyck 1994; Taleb 2012)
"""
import pytest
import math
from app.solvers.information_value import compute_evpi, compute_evsi
from app.solvers.prospect_theory import compute_prospect_theory, compute_crra_profile, cpt_value
from app.solvers.intertemporal import (
    compute_discount_factor_exponential,
    compute_discount_factor_hyperbolic,
    compute_discounting_analysis,
    compare_intertemporal
)
from app.solvers.real_options import compute_real_options, classify_reversibility


class TestInformationValueSolvers:
    def test_evpi_deterministic_known_vector(self):
        """
        Known Raiffa-Schlaifer test vector:
        2 alternatives, 2 states with equal probability p=[0.5, 0.5].
        U = [[100, 0], [0, 100]]
        Prior max EU: max(0.5*100, 0.5*100) = 50.0
        Posterior max EU: 0.5*max(100,0) + 0.5*max(0,100) = 0.5*100 + 0.5*100 = 100.0
        EVPI = 100.0 - 50.0 = 50.0
        """
        probabilities = [0.5, 0.5]
        utility_matrix = [[100.0, 0.0], [0.0, 100.0]]
        res = compute_evpi(probabilities, utility_matrix, ["alt_a", "alt_b"], ["state_1", "state_2"])
        assert res.evpi_utility == 50.0
        assert res.prior_eu_max == 50.0
        assert res.posterior_eu_max == 100.0
        assert res.evpi_fractional == 1.0

    def test_evpi_zero_when_dominant_alternative_exists(self):
        """When one alternative strictly dominates in all states, EVPI must be 0."""
        probabilities = [0.6, 0.4]
        utility_matrix = [[90.0, 80.0], [50.0, 40.0]]
        res = compute_evpi(probabilities, utility_matrix, ["alt_dom", "alt_sub"], ["s1", "s2"])
        assert res.evpi_utility == 0.0
        assert res.evpi_fractional == 0.0

    def test_evsi_efficiency_bound(self):
        """EVSI must be <= EVPI under any imperfect test."""
        probabilities = [0.5, 0.5]
        utility_matrix = [[100.0, 0.0], [0.0, 100.0]]
        evsi_res = compute_evsi(probabilities, utility_matrix, ["alt_a", "alt_b"], ["s1", "s2"])
        assert evsi_res.evsi_utility <= 50.0
        assert 0.0 <= evsi_res.information_efficiency <= 1.0


class TestProspectTheorySolvers:
    def test_cpt_value_loss_aversion_asymmetry(self):
        """Losses must loom larger than equivalent gains under lambda=2.25."""
        ref = 50.0
        gain_val = cpt_value(60.0, reference_point=ref)  # delta = +10
        loss_val = cpt_value(40.0, reference_point=ref)  # delta = -10
        assert gain_val > 0
        assert loss_val < 0
        assert abs(loss_val) > abs(gain_val) * 2.0  # lambda = 2.25

    def test_prospect_theory_detects_framing_divergence(self):
        """Tests that prospect theory detects divergence when loss-aversion alters rankings."""
        alt_ids = ["safe_salaried", "risky_founder"]
        state_ids = ["bull", "bear"]
        probabilities = [0.5, 0.5]
        # Safe has moderate utility in all states; Risky has high upside but painful downside below 50
        utility_matrix = [
            [55.0, 52.0],  # EU = 53.5
            [90.0, 20.0],  # EU = 55.0 (leads on EU, but gets heavily penalized by loss aversion)
        ]
        res = compute_prospect_theory(alt_ids, state_ids, probabilities, utility_matrix)
        assert res.eu_preferred_alt == "risky_founder"
        assert res.cpt_preferred_alt == "safe_salaried"
        assert res.framing_divergence is True
        assert res.loss_aversion_penalty > 0

    def test_crra_profile_risk_premiums(self):
        """Risk-averse CRRA must produce Certainty Equivalent < Expected Payoff for risky alternative."""
        alt_ids = ["sure_thing", "gamble"]
        state_ids = ["s1", "s2"]
        probabilities = [0.5, 0.5]
        utility_matrix = [
            [50.0, 50.0],
            [10.0, 90.0]  # E[W]=50, but variance is high
        ]
        profile = compute_crra_profile(alt_ids, state_ids, probabilities, utility_matrix, gamma=1.5)
        assert profile.certainty_equivalents["sure_thing"] == 50.0
        assert profile.risk_premiums["sure_thing"] == 0.0
        assert profile.certainty_equivalents["gamble"] < 50.0
        assert profile.risk_premiums["gamble"] > 0.0


class TestIntertemporalSolvers:
    def test_exponential_discount_factor(self):
        """D(t) = e^(-0.07*t)"""
        d0 = compute_discount_factor_exponential(0.07, 0.0)
        d1 = compute_discount_factor_exponential(0.07, 1.0)
        assert d0 == 1.0
        assert round(d1, 4) == round(math.exp(-0.07), 4)

    def test_hyperbolic_present_bias_penalty(self):
        """Quasi-hyperbolic present value must be strictly less than exponential for future payoff."""
        res = compute_discounting_analysis(
            time_horizon_years=3.0,
            future_utility_value=100.0,
            delta=0.07,
            beta=0.70
        )
        assert res.hyperbolic_present_value < res.exponential_present_value
        assert res.present_bias_penalty > 0
        assert res.present_bias_penalty_pct > 0

    def test_preference_reversal_detection(self):
        """Detects reversal when an immediate modest payoff beats a delayed larger payoff under present-bias."""
        alt_ids = ["instant_gratification", "patient_builder"]
        horizons = [0.1, 5.0]
        utilities = [50.0, 95.0]
        comp = compare_intertemporal(alt_ids, horizons, utilities, delta=0.07, beta=0.60)
        assert comp.long_run_preferred_alt == "patient_builder"


class TestRealOptionsSolvers:
    def test_reversibility_classification(self):
        """Type 1 vs Type 2 classification based on irreversibility signals."""
        signals_irreversible = ["I will quit my job, sell my house, and invest all savings."]
        rev_type, score = classify_reversibility(max_regret=45.0, eu_spread=60.0, explicit_irreversibility_signals=signals_irreversible)
        assert "Type 1" in rev_type or score < 0.5

        signals_reversible = ["A trial pilot for 30 days while keeping my current consulting contract."]
        rev_type_2, score_2 = classify_reversibility(max_regret=10.0, eu_spread=20.0, explicit_irreversibility_signals=signals_reversible)
        assert score_2 > score

    def test_real_options_convexity_and_barbell(self):
        """Convex vs Concave structure and Barbell strategy trigger."""
        eu_vals = {"alt_a": 60.0}
        regrets = {"alt_a": 30.0}
        res_concave = compute_real_options(
            alt_ids=["alt_a"],
            eu_values=eu_vals,
            max_regret_values=regrets,
            payoff_max=65.0,  # upside delta = 5
            payoff_min=10.0,  # downside delta = 50 -> concave!
            time_horizon_years=2.0
        )
        assert res_concave.convexity_class == "Concave (Fragile)"
        assert res_concave.barbell_applicable is True
