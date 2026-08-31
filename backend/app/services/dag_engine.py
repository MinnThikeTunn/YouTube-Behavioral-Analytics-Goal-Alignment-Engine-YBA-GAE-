import os
import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Job, DAGNode
from app.config import settings

logger = logging.getLogger(__name__)

class DAGEngine:
    GEMINI_MODELS = [
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.7-flash"
    ]

    @classmethod
    def _generate_taxonomy_with_gemini(cls, goal_text: str, user_api_key: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
        """Calls Gemini Flash models to dynamically synthesize a domain-specific hierarchical taxonomy and DAG roadmap."""
        gemini_key = user_api_key or os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or getattr(settings, "YOUTUBE_API_KEY", "")
        if not gemini_key:
            logger.warning("No Gemini API key available for DAG taxonomy generation.")
            return None

        prompt = f"""
You are an expert curriculum designer, cognitive learning architect, and domain taxonomist.
Analyze the user's target learning goal: "{goal_text}".
Generate a hierarchical sub-goal taxonomy and DAG execution graph & mastery roadmap for learning this specific domain.
Generate exactly 3 sequential progression phases (from foundational prerequisites to advanced mastery).

For each phase, provide:
- "title": A concise, domain-specific, professional phase title tailored specifically to "{goal_text}" (e.g. for Cooking: "Culinary Fundamentals & Knife Techniques", NOT generic template titles like "{goal_text} Core Principles").
- "description": A clear, informative 1-2 sentence description explaining what core concepts, tools, or techniques are covered.
- "sub_skills": An array of 2 specific sub-skills under this phase, each an object with:
  - "title": Specific sub-skill name
  - "description": 1 sentence explanation

Return strictly valid JSON with this format:
[
  {{
    "title": "...",
    "description": "...",
    "sub_skills": [
      {{"title": "...", "description": "..."}},
      {{"title": "...", "description": "..."}}
    ]
  }}
]
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2
            }
        }

        for model_name in cls.GEMINI_MODELS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                r = httpx.post(url, json=payload, timeout=8.0)
                if r.status_code == 429:
                    import time
                    time.sleep(1.0)
                    r = httpx.post(url, json=payload, timeout=8.0)

                if r.status_code == 200:
                    data_json = r.json()
                    parts = data_json.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    raw_text = "".join([p["text"] for p in parts if "text" in p and p["text"]]).strip()
                    cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(cleaned_text)
                    if isinstance(parsed, list) and len(parsed) >= 2:
                        logger.info(f"Successfully generated DAG taxonomy using Gemini model {model_name} for goal '{goal_text}'.")
                        return parsed
                else:
                    logger.debug(f"Gemini DAG taxonomy call ({model_name}) returned HTTP {r.status_code}")
            except Exception as e:
                logger.debug(f"Gemini DAG taxonomy call ({model_name}) failed: {e}")
                continue

        return None

    @staticmethod
    def _generate_fallback_taxonomy_nodes(goal_text: str) -> List[Dict[str, Any]]:
        """Domain-specific heuristic fallback taxonomy in case Gemini LLM is unreachable."""
        gt_lower = goal_text.lower()
        if any(k in gt_lower for k in ["cooking", "culinary", "chef", "bake", "baking", "food", "recipe", "kitchen"]):
            return [
                {
                    "title": "Culinary Fundamentals & Knife Techniques",
                    "description": "Master kitchen safety, knife skills, food sanitation, and essential mise en place organization.",
                    "sub_skills": [
                        {"title": "Knife Handling & Precision Cuts", "description": "Grip mechanics, posture, and fundamental cuts including julienne, brunoise, and dice."},
                        {"title": "Kitchen Safety & Mise en Place", "description": "Station organization, sanitation standards, and systematic ingredient preparation."}
                    ]
                },
                {
                    "title": "Core Heat Applications & Flavor Balancing",
                    "description": "Understand dry and moist thermal cooking methods, seasoning dynamics, and flavor chemistry.",
                    "sub_skills": [
                        {"title": "Thermal Methods (Sauté, Roast, Braise)", "description": "Precise heat control, fond generation, and managing Maillard browning."},
                        {"title": "The Four Pillars of Flavor (Salt, Acid, Fat, Heat)", "description": "Balancing richness, acidity, salinity, and sweetness dynamically."}
                    ]
                },
                {
                    "title": "Advanced Gastronomy & Menu Design",
                    "description": "Sauce emulsions, complex plating aesthetics, recipe development, and creative cooking.",
                    "sub_skills": [
                        {"title": "Mother Sauces & Complex Emulsions", "description": "Mastering classical French mother sauces, reductions, and stable emulsions."},
                        {"title": "Plating, Textures & Improvisation", "description": "Aesthetic food styling, contrast creation, and unscripted recipe innovation."}
                    ]
                }
            ]
        elif any(k in gt_lower for k in ["health", "fitness", "workout", "exercise", "diet", "gym", "nutrition", "bodybuilding", "weight"]):
            return [
                {
                    "title": "Nutrition, Caloric Balance & Movement Fundamentals",
                    "description": "Foundational principles of macro-nutrition, metabolic rate, and essential exercise movement patterns.",
                    "sub_skills": [
                        {"title": "Macronutrient Budgeting & Hydration", "description": "Tracking proteins, fats, carbs, and micronutrients."},
                        {"title": "Foundational Movement Biomechanics", "description": "Mastering squat, hinge, push, pull, and core stability."}
                    ]
                },
                {
                    "title": "Workout Routine Execution & Progressive Overload",
                    "description": "Executing structured daily workout sessions, tracking sets/reps, and progressive resistance training.",
                    "sub_skills": [
                        {"title": "Progressive Overload Tracking", "description": "Systematic volume, intensity, and frequency scaling."},
                        {"title": "Form Optimization & Fatigue Management", "description": "Minimizing joint strain and managing intra-workout fatigue."}
                    ]
                },
                {
                    "title": "Recovery, Sleep Optimization & Peak Conditioning",
                    "description": "Advanced cardiovascular conditioning, muscle recovery protocols, and long-term health optimization.",
                    "sub_skills": [
                        {"title": "Active Recovery & Sleep Architecture", "description": "Circadian rhythm alignment, HRV tracking, and muscle repair."},
                        {"title": "Peak Cardiovascular Conditioning", "description": "Zone 2 aerobic base and VO2 max anaerobic intervals."}
                    ]
                }
            ]
        elif any(k in gt_lower for k in ["code", "coding", "software", "python", "javascript", "react", "backend", "frontend", "developer", "machine learning", "ai", "web"]):
            return [
                {
                    "title": "Core Fundamentals & Domain Theory",
                    "description": "Foundational syntax, computer science concepts, algorithms, and data structures.",
                    "sub_skills": [
                        {"title": "Syntax & Core Language Semantics", "description": "Variables, control flow, functions, and memory basics."},
                        {"title": "Data Structures & Algorithmic Thinking", "description": "Arrays, hash maps, complexity, and problem decomposition."}
                    ]
                },
                {
                    "title": "Practical Application & Hands-on Projects",
                    "description": "Building real-world applications, writing clean production code, and API integrations.",
                    "sub_skills": [
                        {"title": "Modular Architecture & Clean Code", "description": "Separation of concerns, design patterns, and unit testing."},
                        {"title": "API Integration & Data Pipelines", "description": "Connecting REST/GraphQL services and persistent storage."}
                    ]
                },
                {
                    "title": "Advanced Architecture & Performance Optimization",
                    "description": "System design, performance tuning, infrastructure scalability, and technical mastery.",
                    "sub_skills": [
                        {"title": "High-Throughput Concurrency & Profiling", "description": "Async execution, bottleneck diagnosis, and caching strategies."},
                        {"title": "Distributed Systems & Cloud Deployment", "description": "CI/CD automation, containerization, and horizontal scaling."}
                    ]
                }
            ]
        elif any(k in gt_lower for k in ["finance", "invest", "trading", "money", "business", "market", "stock", "crypto"]):
            return [
                {
                    "title": "Financial Literacy & Accounting Fundamentals",
                    "description": "Foundational money management, asset classes, and financial accounting principles.",
                    "sub_skills": [
                        {"title": "Budgeting, Cashflow & Debt Management", "description": "Emergency liquidity, expense ratios, and savings rate optimization."},
                        {"title": "Balance Sheet & Income Statement Analysis", "description": "Evaluating corporate fundamentals and financial health."}
                    ]
                },
                {
                    "title": "Portfolio Construction & Investment Execution",
                    "description": "Executing trades, managing investment portfolios, and practical asset allocation.",
                    "sub_skills": [
                        {"title": "Asset Allocation & Index Investing", "description": "Equities, fixed income, diversification, and DCA strategies."},
                        {"title": "Valuation Metrics & Fundamental Research", "description": "P/E ratios, DCF models, and competitive moat analysis."}
                    ]
                },
                {
                    "title": "Risk Management & Wealth Scaling",
                    "description": "Advanced market dynamics, risk mitigation strategies, and long-term capital scaling.",
                    "sub_skills": [
                        {"title": "Position Sizing & Downside Protection", "description": "Stop-losses, hedging, and volatility management."},
                        {"title": "Tax Optimization & Compound Scaling", "description": "Tax-advantaged vehicles and long-term compound growth."}
                    ]
                }
            ]
        else:
            title_cap = goal_text.strip().title()
            return [
                {
                    "title": f"{title_cap} Foundations & Core Prerequisites",
                    "description": f"Foundational terminology, prerequisites, and key baseline knowledge for {goal_text}.",
                    "sub_skills": [
                        {"title": f"{title_cap} Fundamentals", "description": f"Key concepts and baseline knowledge for {goal_text}."},
                        {"title": "Prerequisites & Core Rules", "description": f"Standard terminology and essential baseline practices."}
                    ]
                },
                {
                    "title": f"{title_cap} Practical Execution & Applied Workflows",
                    "description": f"Building real-world projects, routine practice, and hands-on application of {goal_text}.",
                    "sub_skills": [
                        {"title": f"{title_cap} Applied Practice", "description": f"Daily drills and applied exercises in {goal_text}."},
                        {"title": "Project Execution & Implementation", "description": f"Developing tangible outcomes and practicing workflows."}
                    ]
                },
                {
                    "title": f"Advanced {title_cap} Mastery & Strategic Optimization",
                    "description": f"Mastering advanced techniques, performance refinement, and long-term expertise in {goal_text}.",
                    "sub_skills": [
                        {"title": "Systematic Performance Refinement", "description": f"Refining efficiency and eliminating common bottlenecks."},
                        {"title": "Independent Creative Mastery", "description": f"Advanced specialization and independent problem solving."}
                    ]
                }
            ]

    @classmethod
    def build_dag_for_job(cls, db: Session, job_id: str, user_api_key: Optional[str] = None):
        """Builds a complete DAG execution graph with Gemini LLM taxonomy synthesis."""
        # Clear existing nodes for this job
        db.query(DAGNode).filter(DAGNode.job_id == job_id).delete()
        
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            from app.db.models import JobStatus
            job = Job(id=job_id, status=JobStatus.PROCESSING, goal_text="I want to learn software engineering & machine learning")
            db.add(job)
            db.commit()
            db.refresh(job)
        
        goal_text = job.goal_text or "Default Goal"
        resolved_key = user_api_key or getattr(job, "user_api_key", None)
        
        # Calculate dynamic progress score based on job alignment score
        alignment_score_obj = job.alignment_score
        if alignment_score_obj and alignment_score_obj.alignment_probability_score is not None:
            overall_progress = float(alignment_score_obj.alignment_probability_score)
        else:
            overall_progress = 35.0

        root = DAGNode(
            job_id=job_id,
            title=f"Master Goal: {goal_text}",
            description="High-level target goal roadmap & domain skill hierarchy",
            is_completed=1 if overall_progress >= 95.0 else 0,
            progress_pct=round(overall_progress, 1)
        )
        db.add(root)
        db.commit()
        db.refresh(root)
        
        # 1. Attempt Gemini LLM generation
        node_defs = cls._generate_taxonomy_with_gemini(goal_text, user_api_key=resolved_key)
        
        # 2. Fall back to heuristic node definitions if Gemini is unavailable
        if not node_defs or len(node_defs) < 2:
            node_defs = cls._generate_fallback_taxonomy_nodes(goal_text)

        progress_multipliers = [1.35, 0.75, 0.35]

        from app.services.goal_alignment import GoalAlignmentEngine

        for i, phase_def in enumerate(node_defs[:3]):
            mult = progress_multipliers[i] if i < len(progress_multipliers) else 0.25
            phase_pct = min(100.0, round(overall_progress * mult, 1))
            
            try:
                emb = GoalAlignmentEngine.compute_text_embedding(f"{phase_def['title']} {phase_def.get('description', '')}").tolist()
            except Exception:
                emb = []

            phase_node = DAGNode(
                job_id=job_id,
                parent_id=root.id,
                title=phase_def["title"],
                description=phase_def.get("description"),
                is_completed=1 if phase_pct >= 95.0 else 0,
                progress_pct=phase_pct,
                embedding_json=json.dumps(emb)
            )
            db.add(phase_node)
            db.commit()
            db.refresh(phase_node)

            # Add hierarchical sub-skills if available
            sub_skills = phase_def.get("sub_skills", [])
            for j, sub_skill in enumerate(sub_skills):
                sub_mult = 1.05 if j == 0 else 0.95
                sub_pct = min(100.0, round(phase_pct * sub_mult, 1))
                try:
                    sub_emb = GoalAlignmentEngine.compute_text_embedding(f"{sub_skill['title']} {sub_skill.get('description', '')}").tolist()
                except Exception:
                    sub_emb = []

                sub_node = DAGNode(
                    job_id=job_id,
                    parent_id=phase_node.id,
                    title=sub_skill["title"],
                    description=sub_skill.get("description"),
                    is_completed=1 if sub_pct >= 95.0 else 0,
                    progress_pct=sub_pct,
                    embedding_json=json.dumps(sub_emb)
                )
                db.add(sub_node)
            
            db.commit()

        return root

    @staticmethod
    def get_dag(db: Session, job_id: str):
        return db.query(DAGNode).filter(DAGNode.job_id == job_id).all()
