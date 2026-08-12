"""
Packaging Optimizer Service — Pre-Publish Viewer Attraction Score (VAS) Engine.

Calculates VAS = w1 * TitleAlignment + w2 * ThumbnailVisionScore + w3 * HookScriptScore
to objectively evaluate video packaging quality before publishing.
"""
import re
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.schemas.vas import (
    VASEvalRequestDTO, VASEvalResponseDTO,
    ThumbnailAnalysisDTO, TitleAnalysisDTO, TitlePatternDTO,
    HookAnalysisDTO, DetailedVASAnalysisDTO,
)
from app.db.models import VASEvaluation


class PackagingOptimizerService:
    """Pre-publish video packaging evaluation engine."""

    # Default VAS formula weights
    W1_TITLE = 0.40
    W2_THUMBNAIL = 0.35
    W3_HOOK = 0.25

    # ── NLP keyword banks ───────────────────────────────────────
    CURIOSITY_WORDS = {
        "secret", "why", "how", "stop", "never", "proven", "truth",
        "mistake", "avoid", "surprising", "hidden", "revealed"
    }
    POWER_WORDS = {
        "ultimate", "fast", "top", "best", "complete", "definitive",
        "essential", "master", "pro", "advanced", "incredible"
    }
    HOOK_PHRASES = {
        "in this video", "imagine", "what if", "don't", "mistake",
        "most people", "nobody talks about", "here's why",
        "the truth is", "stop doing this", "you need to know"
    }
    EMOTIONAL_WORDS = {
        "amazing", "incredible", "shocking", "terrifying", "beautiful",
        "heartbreaking", "inspiring", "devastating", "brilliant", "insane"
    }
    CTA_PHRASES = {
        "subscribe", "like", "comment", "share", "click", "link below",
        "check out", "let me know", "tell me", "try it"
    }

    # ── Title Scoring ───────────────────────────────────────────
    @classmethod
    def calculate_title_score(cls, title: str) -> float:
        """Score title quality on a 0-100 scale based on NLP heuristics."""
        score = 50.0  # baseline
        t = title.lower().strip()

        # Length optimization (40-70 chars is the YouTube sweet spot)
        length = len(title)
        if 40 <= length <= 70:
            score += 15.0
        elif 25 <= length < 40 or 70 < length <= 90:
            score += 5.0
        else:
            score -= 10.0

        # Curiosity word presence
        curiosity_hits = sum(1 for w in cls.CURIOSITY_WORDS if w in t)
        score += min(curiosity_hits * 8.0, 16.0)

        # Power word presence
        power_hits = sum(1 for w in cls.POWER_WORDS if w in t)
        score += min(power_hits * 6.0, 12.0)

        # Question hook bonus
        if "?" in title:
            score += 7.0

        # Number presence bonus (e.g. "Top 10", "5 Ways")
        if re.search(r'\d+', title):
            score += 5.0

        return round(min(100.0, max(0.0, score)), 1)

    # ── Thumbnail Vision Scoring ────────────────────────────────
    @classmethod
    def calculate_thumbnail_score(
        cls,
        brightness: Optional[float] = None,
        contrast: Optional[float] = None
    ) -> float:
        """Score thumbnail visual quality on a 0-100 scale.

        brightness: normalized lightness 0.0-1.0 (optimal 0.4-0.8)
        contrast:   normalized contrast 0.0-1.0 (optimal 0.5-0.9)
        """
        score = 55.0  # baseline when no image data provided

        if brightness is not None:
            if 0.4 <= brightness <= 0.8:
                score += 20.0
            elif 0.25 <= brightness < 0.4 or 0.8 < brightness <= 0.95:
                score += 8.0
            else:
                score -= 10.0

        if contrast is not None:
            if 0.5 <= contrast <= 0.9:
                score += 20.0
            elif 0.3 <= contrast < 0.5 or 0.9 < contrast <= 1.0:
                score += 8.0
            else:
                score -= 10.0

        return round(min(100.0, max(0.0, score)), 1)

    # ── Hook Script Scoring ─────────────────────────────────────
    @classmethod
    def calculate_hook_score(cls, hook_script: str) -> float:
        """Score the opening 30-second script on a 0-100 scale."""
        score = 45.0  # baseline
        t = hook_script.lower().strip()
        words = t.split()
        word_count = len(words)

        # Optimal word count for 30s (approx 60-90 words at natural speech pace)
        if 60 <= word_count <= 90:
            score += 20.0
        elif 40 <= word_count < 60 or 90 < word_count <= 120:
            score += 10.0
        elif word_count < 20:
            score -= 10.0

        # Hook phrase density
        hook_hits = sum(1 for phrase in cls.HOOK_PHRASES if phrase in t)
        score += min(hook_hits * 8.0, 24.0)

        # Curiosity gap density (questions in the hook)
        question_count = hook_script.count("?")
        score += min(question_count * 5.0, 10.0)

        return round(min(100.0, max(0.0, score)), 1)

    # ── VAS Composite Formula ───────────────────────────────────
    @classmethod
    def calculate_vas(
        cls,
        title_score: float,
        thumbnail_score: float,
        hook_score: float,
        w1: float = None,
        w2: float = None,
        w3: float = None,
    ) -> float:
        """VAS = w1 * TitleScore + w2 * ThumbnailScore + w3 * HookScore."""
        w1 = w1 if w1 is not None else cls.W1_TITLE
        w2 = w2 if w2 is not None else cls.W2_THUMBNAIL
        w3 = w3 if w3 is not None else cls.W3_HOOK
        return round(w1 * title_score + w2 * thumbnail_score + w3 * hook_score, 1)

    # ── Recommendation Generator ────────────────────────────────
    @classmethod
    def generate_recommendations(
        cls,
        title_score: float,
        thumbnail_score: float,
        hook_score: float
    ) -> List[str]:
        """Generate targeted improvement recommendations for weak sub-scores."""
        recs = []

        if title_score < 65.0:
            recs.append("Add curiosity-driving words like 'secret', 'why', or 'proven' to your title.")
        if title_score < 50.0:
            recs.append("Shorten or lengthen your title to the optimal 40-70 character sweet spot.")

        if thumbnail_score < 65.0:
            recs.append("Increase thumbnail contrast ratio by adding high-lightness text overlay.")
        if thumbnail_score < 50.0:
            recs.append("Ensure thumbnail brightness is in the 0.4-0.8 optimal range.")

        if hook_score < 65.0:
            recs.append("Include a curiosity hook in the first 10 seconds of your script.")
        if hook_score < 50.0:
            recs.append("Aim for 60-90 words in your 30-second opening hook for optimal pacing.")

        if not recs:
            recs.append("Excellent packaging — your title, thumbnail, and hook are all well-optimized!")

        return recs

    # ── Title Improvement Generator ─────────────────────────────
    @classmethod
    def generate_improved_titles(cls, title: str) -> List[str]:
        """Generate 3 high-CTR title variations."""
        base = title.strip().rstrip(".")
        ideas = [
            f"How to {base} Step-by-Step (Complete Guide)",
            f"Stop Doing This: {base} the Right Way",
            f"Why Most People Fail at {base} — And How You Won't"
        ]
        return ideas

    # ── Main Evaluation Orchestrator ────────────────────────────
    @classmethod
    def evaluate(
        cls,
        request: VASEvalRequestDTO,
        db: Optional[Session] = None
    ) -> VASEvalResponseDTO:
        """Full VAS evaluation pipeline: score → recommend → persist → respond."""
        title_score = cls.calculate_title_score(request.title)
        thumbnail_score = cls.calculate_thumbnail_score(
            request.thumbnail_brightness,
            request.thumbnail_contrast
        )
        hook_score = cls.calculate_hook_score(request.hook_script)
        overall_vas = cls.calculate_vas(title_score, thumbnail_score, hook_score)

        recommendations = cls.generate_recommendations(title_score, thumbnail_score, hook_score)
        improved_titles = cls.generate_improved_titles(request.title)

        # Persist evaluation for closed-loop telemetry
        if db is not None:
            record = VASEvaluation(
                title=request.title,
                hook_script=request.hook_script,
                title_score=title_score,
                thumbnail_score=thumbnail_score,
                hook_score=hook_score,
                overall_vas=overall_vas,
            )
            db.add(record)
            db.commit()

        return VASEvalResponseDTO(
            overall_vas=overall_vas,
            title_score=title_score,
            thumbnail_score=thumbnail_score,
            hook_score=hook_score,
            recommendations=recommendations,
            improved_title_ideas=improved_titles,
        )

    # ═══════════════════════════════════════════════════════════
    #  Phase 4 Ticket 02 — Deep Diagnostic Analyzers
    # ═══════════════════════════════════════════════════════════

    # ── Thumbnail Vision Analyzer ───────────────────────────────
    @classmethod
    def analyze_thumbnail_vision(
        cls,
        brightness: Optional[float] = None,
        contrast: Optional[float] = None
    ) -> ThumbnailAnalysisDTO:
        """Deep thumbnail diagnostic: color balance, saturation, impact, legibility."""
        b = brightness if brightness is not None else 0.5
        c = contrast if contrast is not None else 0.5

        # Color balance: distance from optimal midpoint 0.6
        color_balance = round(max(0.0, 1.0 - abs(b - 0.6) * 2.5) * 100.0, 1)

        # Saturation estimate: derived from contrast intensity
        saturation_estimate = round(min(100.0, c * 110.0), 1)

        # Visual impact: weighted blend of brightness placement and contrast strength
        impact_b = 1.0 - abs(b - 0.55) * 2.0  # peak at 0.55
        impact_c = min(1.0, c * 1.3)            # higher contrast = higher impact
        visual_impact_score = round(min(100.0, max(0.0, (impact_b * 0.4 + impact_c * 0.6) * 100.0)), 1)

        # Text legibility: high contrast + moderate brightness = readable overlays
        legibility_raw = (c * 0.7 + (1.0 - abs(b - 0.5)) * 0.3) * 100.0
        legibility_score = round(min(100.0, max(0.0, legibility_raw)), 1)

        # Readability grade
        if legibility_score >= 80.0:
            readability_grade = "EXCELLENT"
        elif legibility_score >= 60.0:
            readability_grade = "GOOD"
        elif legibility_score >= 40.0:
            readability_grade = "FAIR"
        else:
            readability_grade = "POOR"

        return ThumbnailAnalysisDTO(
            brightness=brightness,
            contrast=contrast,
            color_balance=color_balance,
            saturation_estimate=saturation_estimate,
            visual_impact_score=visual_impact_score,
            legibility_score=legibility_score,
            readability_grade=readability_grade,
        )

    # ── Advanced Title Pattern Generator ────────────────────────
    @classmethod
    def generate_title_patterns(cls, title: str) -> List[TitlePatternDTO]:
        """Generate advanced title variations using proven CTR patterns."""
        base = title.strip().rstrip(".")
        # Extract a short topic keyword (first 4 significant words)
        words = [w for w in base.split() if len(w) > 2]
        topic = " ".join(words[:4]) if words else base

        patterns = [
            TitlePatternDTO(
                pattern_type="Number Hook",
                suggested_title=f"7 {topic} Secrets Nobody Tells You"
            ),
            TitlePatternDTO(
                pattern_type="Negative Hook",
                suggested_title=f"Stop Doing This With {topic} (It's Costing You)"
            ),
            TitlePatternDTO(
                pattern_type="Curiosity Gap",
                suggested_title=f"The Truth About {topic} That Experts Won't Admit"
            ),
            TitlePatternDTO(
                pattern_type="Comparison Hook",
                suggested_title=f"{topic}: Beginner vs Pro (What's the Difference?)"
            ),
            TitlePatternDTO(
                pattern_type="How-To Authority",
                suggested_title=f"How I Mastered {topic} in 30 Days (Step-by-Step)"
            ),
        ]
        return patterns

    # ── Title Deep Analysis ─────────────────────────────────────
    @classmethod
    def analyze_title(cls, title: str) -> TitleAnalysisDTO:
        """Deep title diagnostic: character count, word patterns, suggestions."""
        t = title.lower().strip()
        curiosity_count = sum(1 for w in cls.CURIOSITY_WORDS if w in t)
        power_count = sum(1 for w in cls.POWER_WORDS if w in t)
        has_number = bool(re.search(r'\d+', title))
        has_question = "?" in title

        return TitleAnalysisDTO(
            original_title=title,
            char_count=len(title),
            curiosity_word_count=curiosity_count,
            power_word_count=power_count,
            has_number=has_number,
            has_question=has_question,
            pattern_suggestions=cls.generate_title_patterns(title),
        )

    # ── Hook Script Retention Analyzer ──────────────────────────
    @classmethod
    def analyze_hook_retention(cls, hook_script: str) -> HookAnalysisDTO:
        """Deep hook analysis: pacing, emotional arc, CTA, retention estimate."""
        t = hook_script.lower().strip()
        words = t.split()
        word_count = len(words)

        # Word pacing score (60-90 words optimal for 30s)
        if 60 <= word_count <= 90:
            word_pacing = 95.0
        elif 45 <= word_count < 60 or 90 < word_count <= 110:
            word_pacing = 70.0
        elif 30 <= word_count < 45:
            word_pacing = 50.0
        else:
            word_pacing = 30.0

        # Emotional arc score
        emotional_hits = sum(1 for w in cls.EMOTIONAL_WORDS if w in t)
        emotional_arc = round(min(100.0, 40.0 + emotional_hits * 15.0), 1)

        # CTA presence
        cta_hits = sum(1 for phrase in cls.CTA_PHRASES if phrase in t)
        cta_present = cta_hits > 0

        # Hook phrase density
        hook_hits = sum(1 for phrase in cls.HOOK_PHRASES if phrase in t)

        # Estimated retention percentage
        retention_base = 35.0
        retention_base += min(word_pacing * 0.25, 25.0)
        retention_base += min(hook_hits * 5.0, 15.0)
        retention_base += min(emotional_hits * 4.0, 12.0)
        if cta_present:
            retention_base += 5.0
        question_count = hook_script.count("?")
        retention_base += min(question_count * 3.0, 9.0)
        estimated_retention = round(min(100.0, max(0.0, retention_base)), 1)

        return HookAnalysisDTO(
            word_count=word_count,
            word_pacing_score=round(word_pacing, 1),
            emotional_arc_score=emotional_arc,
            call_to_action_presence=cta_present,
            hook_phrase_count=hook_hits,
            estimated_retention_pct=estimated_retention,
        )

    # ── Detailed VAS Analysis Orchestrator ──────────────────────
    @classmethod
    def detailed_analysis(cls, request: VASEvalRequestDTO) -> DetailedVASAnalysisDTO:
        """Full detailed diagnostic analysis combining all analyzers."""
        title_score = cls.calculate_title_score(request.title)
        thumbnail_score = cls.calculate_thumbnail_score(
            request.thumbnail_brightness, request.thumbnail_contrast
        )
        hook_score = cls.calculate_hook_score(request.hook_script)
        overall_vas = cls.calculate_vas(title_score, thumbnail_score, hook_score)

        thumbnail_analysis = cls.analyze_thumbnail_vision(
            request.thumbnail_brightness, request.thumbnail_contrast
        )
        title_analysis = cls.analyze_title(request.title)
        hook_analysis = cls.analyze_hook_retention(request.hook_script)

        recommendations = cls.generate_recommendations(title_score, thumbnail_score, hook_score)
        title_patterns = cls.generate_title_patterns(request.title)

        return DetailedVASAnalysisDTO(
            overall_vas=overall_vas,
            title_score=title_score,
            thumbnail_score=thumbnail_score,
            hook_score=hook_score,
            thumbnail_analysis=thumbnail_analysis,
            title_analysis=title_analysis,
            hook_analysis=hook_analysis,
            recommendations=recommendations,
            improved_title_ideas=title_patterns,
        )
