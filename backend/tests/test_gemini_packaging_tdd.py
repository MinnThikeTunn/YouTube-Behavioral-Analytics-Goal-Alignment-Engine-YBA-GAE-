import pytest
from unittest.mock import patch, MagicMock
from app.schemas.vas import VASEvalRequestDTO, VASEvalResponseDTO
from app.services.packaging_optimizer import PackagingOptimizerService


def test_evaluate_vas_with_gemini_ai():
    """Seam: evaluate() with Gemini AI response."""
    request = VASEvalRequestDTO(
        title="10 Secret Linux Commands Every DevOps Engineer Must Know",
        hook_script="Most developers use the same five Linux commands every day, but these 10 will 10x your productivity.",
        thumbnail_brightness=0.6,
        thumbnail_contrast=0.7
    )

    mock_gemini_output = {
        "title_score": 92.5,
        "thumbnail_score": 88.0,
        "hook_score": 90.0,
        "recommendations": [
            "Add a high-contrast terminal screenshot overlay.",
            "Emphasize the speed benefit in the first 5 seconds."
        ],
        "improved_title_ideas": [
            "10 Dangerous Linux Commands You Should Master Today",
            "Stop Using Linux Like a Beginner: 10 Terminal Hacks",
            "Why Senior DevOps Engineers Never Ignore These 10 Commands"
        ]
    }

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=mock_gemini_output):
        result = PackagingOptimizerService.evaluate(request)

        assert isinstance(result, VASEvalResponseDTO)
        assert result.title_score == 92.5
        assert result.thumbnail_score == 88.0
        assert result.hook_score == 90.0
        # Check weighted formula: 0.4*92.5 + 0.35*88.0 + 0.25*90.0 = 37.0 + 30.8 + 22.5 = 90.3
        assert result.overall_vas == pytest.approx(90.3, abs=0.2)
        assert len(result.recommendations) == 2
        assert "Add a high-contrast" in result.recommendations[0]
        assert len(result.improved_title_ideas) == 3
        assert "10 Dangerous Linux Commands" in result.improved_title_ideas[0]


def test_evaluate_vas_gemini_fallback():
    """Seam: evaluate() falls back to heuristic scoring when Gemini returns None."""
    request = VASEvalRequestDTO(
        title="Why Most Developers Never Master the Ultimate FastAPI Secret",
        hook_script="In this video I will show you why most developers fail and how you can fix it right now.",
        thumbnail_brightness=0.6,
        thumbnail_contrast=0.7
    )

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=None):
        result = PackagingOptimizerService.evaluate(request)

        assert isinstance(result, VASEvalResponseDTO)
        assert result.overall_vas > 0
        assert result.title_score > 60.0
        assert len(result.recommendations) >= 1
        assert len(result.improved_title_ideas) >= 1


def test_detailed_analysis_with_gemini_ai():
    """Seam: detailed_analysis() with Gemini AI response."""
    request = VASEvalRequestDTO(
        title="10 Secret Linux Commands Every DevOps Engineer Must Know",
        hook_script="Most developers use the same five Linux commands every day, but these 10 will 10x your productivity.",
        thumbnail_brightness=0.65,
        thumbnail_contrast=0.75
    )

    mock_gemini_diagnostic = {
        "title_score": 94.0,
        "thumbnail_score": 89.0,
        "hook_score": 91.0,
        "thumbnail_analysis": {
            "brightness": 0.65,
            "contrast": 0.75,
            "color_balance": 88.0,
            "saturation_estimate": 82.5,
            "visual_impact_score": 89.5,
            "legibility_score": 92.0,
            "readability_grade": "EXCELLENT"
        },
        "title_analysis": {
            "original_title": "10 Secret Linux Commands Every DevOps Engineer Must Know",
            "char_count": 58,
            "curiosity_word_count": 2,
            "power_word_count": 1,
            "has_number": True,
            "has_question": False,
            "pattern_suggestions": [
                {"pattern_type": "Number Hook", "suggested_title": "10 Secret Linux Commands Every DevOps Engineer Must Know"},
                {"pattern_type": "Negative Hook", "suggested_title": "Stop Running These Bad Linux Commands (Do This Instead)"},
                {"pattern_type": "Curiosity Gap", "suggested_title": "The Hidden Linux Terminal Commands Nobody Talks About"},
                {"pattern_type": "Comparison Hook", "suggested_title": "Basic Bash vs Pro DevOps Linux Commands: 10 Key Differences"},
                {"pattern_type": "How-To Authority", "suggested_title": "How to Master 10 High-Speed Linux Commands in 10 Minutes"}
            ]
        },
        "hook_analysis": {
            "word_count": 17,
            "word_pacing_score": 90.0,
            "emotional_arc_score": 85.0,
            "call_to_action_presence": False,
            "hook_phrase_count": 2,
            "estimated_retention_pct": 89.5
        },
        "recommendations": [
            "Add visual terminal callouts to match the high pacing of the hook."
        ],
        "improved_title_ideas": [
            {"pattern_type": "Number Hook", "suggested_title": "10 Secret Linux Commands Every DevOps Engineer Must Know"}
        ]
    }

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=mock_gemini_diagnostic):
        result = PackagingOptimizerService.detailed_analysis(request)

        assert result.title_score == 94.0
        assert result.thumbnail_analysis.readability_grade == "EXCELLENT"
        assert len(result.title_analysis.pattern_suggestions) == 5
        assert result.title_analysis.pattern_suggestions[1].pattern_type == "Negative Hook"
        assert "Stop Running These Bad Linux Commands" in result.title_analysis.pattern_suggestions[1].suggested_title
        assert result.hook_analysis.estimated_retention_pct == 89.5
        assert result.overall_vas > 85.0


def test_calculate_composite_8factor_with_gemini_ai():
    """Seam: calculate_composite_8factor() with Gemini AI."""
    request = VASEvalRequestDTO(
        title="10 Secret Linux Commands Every DevOps Engineer Must Know",
        hook_script="Most developers use the same five Linux commands every day, but these 10 will 10x your productivity.",
        thumbnail_brightness=0.65,
        thumbnail_contrast=0.75
    )

    mock_gemini_factors = {
        "factors": [
            {"factor_key": "title_ctr_potential", "factor_name": "Title CTR Potential", "score": 93.0, "weight": 0.15, "description": "High search interest around DevOps terminal secrets."},
            {"factor_key": "thumbnail_visual_impact", "factor_name": "Thumbnail Visual Impact", "score": 88.0, "weight": 0.15, "description": "Strong contrast dynamics."},
            {"factor_key": "thumbnail_legibility", "factor_name": "Thumbnail Legibility", "score": 87.0, "weight": 0.10, "description": "Mobile readability passes standard."},
            {"factor_key": "hook_pacing_retention", "factor_name": "Hook Script Pacing", "score": 92.0, "weight": 0.15, "description": "Immediate curiosity payoff in 15 seconds."},
            {"factor_key": "emotional_hook_intensity", "factor_name": "Emotional Hook Intensity", "score": 85.0, "weight": 0.10, "description": "Compelling professional motivation."},
            {"factor_key": "market_demand_index", "factor_name": "Market Demand Index", "score": 91.0, "weight": 0.12, "description": "DevOps Linux queries have surged 45% YoY."},
            {"factor_key": "competition_gap_advantage", "factor_name": "Competition Gap Advantage", "score": 84.5, "weight": 0.11, "description": "Unsaturated specific commands angle in 2026."},
            {"factor_key": "trend_velocity_momentum", "factor_name": "Trend Velocity Momentum", "score": 93.0, "weight": 0.12, "description": "High current momentum in tech content."}
        ]
    }

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=mock_gemini_factors):
        result = PackagingOptimizerService.calculate_composite_8factor(request)

        assert len(result.factors) == 8
        factor_map = {f.factor_key: f for f in result.factors}
        assert factor_map["market_demand_index"].score == 91.0
        assert "surged 45% YoY" in factor_map["market_demand_index"].description
        assert factor_map["competition_gap_advantage"].score == 84.5
        assert factor_map["trend_velocity_momentum"].score == 93.0
        assert result.composite_overall_score > 85.0


def test_calculate_composite_8factor_gemini_fallback():
    """Seam: calculate_composite_8factor() fallback when Gemini is unavailable."""
    request = VASEvalRequestDTO(
        title="Deploy FastAPI in Production",
        hook_script="In this video we will deploy FastAPI with high performance.",
        thumbnail_brightness=0.6,
        thumbnail_contrast=0.7
    )

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=None):
        result = PackagingOptimizerService.calculate_composite_8factor(request)

        assert len(result.factors) == 8
        assert result.composite_overall_score > 0


def test_evaluate_ab_packaging_with_gemini_ai():
    """Seam: evaluate_ab_packaging() with Gemini AI."""
    from app.schemas.vas import ABPackagingRequestDTO, ABPackagingVariantDTO

    req = ABPackagingRequestDTO(
        variants=[
            ABPackagingVariantDTO(
                variant_id="v1",
                variant_label="Variant A (Action)",
                title="10 Docker Tricks That Cut Build Times in Half",
                hook_script="If your Docker builds take longer than 3 minutes, you are making these 3 cache mistakes.",
                thumbnail_brightness=0.6,
                thumbnail_contrast=0.75
            ),
            ABPackagingVariantDTO(
                variant_id="v2",
                variant_label="Variant B (Curiosity)",
                title="Why Senior DevOps Engineers Never Use Docker Like This",
                hook_script="Stop putting dependencies inside your main layer. Here is what Netflix and Uber do instead.",
                thumbnail_brightness=0.55,
                thumbnail_contrast=0.65
            )
        ]
    )

    mock_gemini_ab = {
        "winning_variant_id": "v2",
        "best_overall_vas": 94.2,
        "comparison_summary": "Variant B wins with higher psychological intrigue and negative framing, driving 18.5% higher estimated CTR.",
        "variants": [
            {
                "variant_id": "v2",
                "variant_label": "Variant B (Curiosity)",
                "title": "Why Senior DevOps Engineers Never Use Docker Like This",
                "overall_vas": 94.2,
                "title_score": 96.0,
                "thumbnail_score": 91.0,
                "hook_score": 95.0,
                "is_winner": True,
                "predicted_ctr_uplift_pct": 18.5,
                "key_advantage": "Extreme authority gap and high emotional retention hook mentioning tier-1 tech firms.",
                "recommendations": ["Ensure font size remains legible at 320px mobile preview."]
            },
            {
                "variant_id": "v1",
                "variant_label": "Variant A (Action)",
                "title": "10 Docker Tricks That Cut Build Times in Half",
                "overall_vas": 84.0,
                "title_score": 85.0,
                "thumbnail_score": 86.0,
                "hook_score": 81.0,
                "is_winner": False,
                "predicted_ctr_uplift_pct": 0.0,
                "key_advantage": "Practical number hook suitable for search traffic.",
                "recommendations": ["Increase urgency in opening 10 seconds."]
            }
        ]
    }

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=mock_gemini_ab):
        result = PackagingOptimizerService.evaluate_ab_packaging(req)

        assert result.winning_variant_id == "v2"
        assert result.best_overall_vas == 94.2
        assert "Variant B wins" in result.comparison_summary
        assert len(result.variants) == 2
        v2 = next(v for v in result.variants if v.variant_id == "v2")
        assert v2.is_winner is True
        assert v2.predicted_ctr_uplift_pct == 18.5
        assert "Extreme authority gap" in v2.key_advantage


def test_evaluate_ab_packaging_gemini_fallback():
    """Seam: evaluate_ab_packaging() fallback when Gemini is unavailable."""
    from app.schemas.vas import ABPackagingRequestDTO, ABPackagingVariantDTO

    req = ABPackagingRequestDTO(
        variants=[
            ABPackagingVariantDTO(
                variant_id="v1",
                variant_label="Variant A",
                title="FastAPI Guide 2026",
                hook_script="In this video we build a FastAPI app.",
                thumbnail_brightness=0.6,
                thumbnail_contrast=0.7
            )
        ]
    )

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=None):
        result = PackagingOptimizerService.evaluate_ab_packaging(req)

        assert result.winning_variant_id == "v1"
        assert result.best_overall_vas > 0
        assert len(result.variants) == 1


def test_generate_hook_scripts_with_gemini_ai():
    """Seam: generate_hook_scripts() with Gemini AI."""
    from app.schemas.vas import HookGenerationRequestDTO

    req = HookGenerationRequestDTO(
        title="Stop Using Redux in React 19",
        topic="Modern React State Management",
        target_audience="Frontend Engineers"
    )

    mock_gemini_hooks = {
        "hooks": [
            {
                "hook_style": "Curiosity Gap",
                "script_text": "Almost every React developer is still setting up massive Redux boilers, but React 19 just quietly introduced a native pattern that replaces 90% of your store in four lines. In this video, I will show you why you should delete your action creators today.",
                "word_count": 43,
                "estimated_retention_pct": 93.5,
                "pacing_notes": "Deliver the controversial thesis at 0:08, reveal the 4-line hook at 0:20."
            },
            {
                "hook_style": "Pain Point / Mistake",
                "script_text": "If you are debugging state synchronizations across three different slices, stop right now. It is burning your sprint velocity. Here is how senior architects at Meta are handling atomic mutations in React 19 without third party dependencies.",
                "word_count": 36,
                "estimated_retention_pct": 95.0,
                "pacing_notes": "Direct negative pattern disruption. Fast visual overlay of messy code."
            },
            {
                "hook_style": "Story & Challenge Hook",
                "script_text": "Last week we benchmarked a 50,000 active user dashboard after ripping out Redux completely. The memory footprint dropped by 40% immediately. Watch this before you write your next reducer.",
                "word_count": 28,
                "estimated_retention_pct": 89.0,
                "pacing_notes": "Metrics and social proof hook. High authority demonstration."
            }
        ]
    }

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=mock_gemini_hooks):
        result = PackagingOptimizerService.generate_hook_scripts(req)

        assert result.title == req.title
        assert len(result.hooks) == 3
        h1 = result.hooks[0]
        assert h1.hook_style == "Curiosity Gap"
        assert "React 19" in h1.script_text
        assert h1.estimated_retention_pct == 93.5
        assert "Deliver the controversial thesis" in h1.pacing_notes


def test_generate_hook_scripts_gemini_fallback():
    """Seam: generate_hook_scripts() fallback when Gemini is unavailable."""
    from app.schemas.vas import HookGenerationRequestDTO

    req = HookGenerationRequestDTO(
        title="Deploy FastAPI in Production"
    )

    with patch.object(PackagingOptimizerService, "_call_gemini_json", return_value=None):
        result = PackagingOptimizerService.generate_hook_scripts(req)

        assert result.title == req.title
        assert len(result.hooks) == 3
        assert any(h.hook_style == "Curiosity Gap" for h in result.hooks)
