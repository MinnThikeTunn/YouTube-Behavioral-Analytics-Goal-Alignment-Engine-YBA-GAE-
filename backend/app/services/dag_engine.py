from sqlalchemy.orm import Session
from app.db.models import Job, DAGNode
import json

class DAGEngine:
    @staticmethod
    def _generate_taxonomy_nodes(goal_text: str):
        gt_lower = goal_text.lower()
        if any(k in gt_lower for k in ["health", "fitness", "workout", "exercise", "diet", "gym", "nutrition", "bodybuilding", "weight"]):
            return [
                {
                    "title": "Nutrition, Caloric Balance & Movement Fundamentals",
                    "description": "Foundational principles of macro-nutrition, metabolic rate, and essential exercise movement patterns"
                },
                {
                    "title": "Workout Routine Execution & Progressive Overload",
                    "description": "Executing structured daily workout sessions, tracking sets/reps, and progressive resistance training"
                },
                {
                    "title": "Recovery, Sleep Optimization & Peak Conditioning",
                    "description": "Advanced cardiovascular conditioning, muscle recovery protocols, and long-term health optimization"
                }
            ]
        elif any(k in gt_lower for k in ["code", "coding", "software", "python", "javascript", "react", "backend", "frontend", "developer", "machine learning", "ai", "web"]):
            return [
                {
                    "title": "Core Fundamentals & Domain Theory",
                    "description": "Foundational syntax, computer science concepts, algorithms, and data structures"
                },
                {
                    "title": "Practical Application & Hands-on Projects",
                    "description": "Building real-world applications, writing clean production code, and API integrations"
                },
                {
                    "title": "Advanced Architecture & Performance Optimization",
                    "description": "System design, performance tuning, infrastructure scalability, and technical mastery"
                }
            ]
        elif any(k in gt_lower for k in ["finance", "invest", "trading", "money", "business", "market", "stock", "crypto"]):
            return [
                {
                    "title": "Financial Literacy & Accounting Fundamentals",
                    "description": "Foundational money management, asset classes, and financial accounting principles"
                },
                {
                    "title": "Portfolio Construction & Investment Execution",
                    "description": "Executing trades, managing investment portfolios, and practical asset allocation"
                },
                {
                    "title": "Risk Management & Wealth Scaling",
                    "description": "Advanced market dynamics, risk mitigation strategies, and long-term capital scaling"
                }
            ]
        else:
            title_cap = goal_text.strip().title()
            return [
                {
                    "title": f"{title_cap} Core Principles & Theory",
                    "description": f"Foundational terminology, prerequisites, and key rules for {goal_text}"
                },
                {
                    "title": f"{title_cap} Practical Execution & Projects",
                    "description": f"Building real-world projects, routine practice, and hands-on application of {goal_text}"
                },
                {
                    "title": f"Advanced {title_cap} Mastery & Optimization",
                    "description": f"Mastering advanced techniques, performance refinement, and long-term expertise in {goal_text}"
                }
            ]

    @staticmethod
    def build_dag_for_job(db: Session, job_id: str):
        # Clear existing
        db.query(DAGNode).filter(DAGNode.job_id == job_id).delete()
        
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            from app.db.models import JobStatus
            job = Job(id=job_id, status=JobStatus.PROCESSING, goal_text="I want to learn software engineering & machine learning")
            db.add(job)
            db.commit()
            db.refresh(job)
        
        goal_text = job.goal_text or "Default Goal"
        
        # Calculate dynamic progress score based on job alignment score
        alignment_score_obj = job.alignment_score
        if alignment_score_obj and alignment_score_obj.alignment_probability_score is not None:
            overall_progress = float(alignment_score_obj.alignment_probability_score)
        else:
            overall_progress = 35.0
            
        p1 = min(100.0, round(overall_progress * 1.35, 1))
        p2 = min(100.0, round(overall_progress * 0.75, 1))
        p3 = min(100.0, round(overall_progress * 0.35, 1))

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
        
        node_defs = DAGEngine._generate_taxonomy_nodes(goal_text)

        # Generate real 384-d vector embeddings using GoalAlignmentEngine
        try:
            from app.services.goal_alignment import GoalAlignmentEngine
            emb1 = GoalAlignmentEngine.compute_text_embedding(f"{node_defs[0]['title']} {node_defs[0]['description']}").tolist()
            emb2 = GoalAlignmentEngine.compute_text_embedding(f"{node_defs[1]['title']} {node_defs[1]['description']}").tolist()
            emb3 = GoalAlignmentEngine.compute_text_embedding(f"{node_defs[2]['title']} {node_defs[2]['description']}").tolist()
        except Exception:
            emb1, emb2, emb3 = [], [], []

        child1 = DAGNode(
            job_id=job_id,
            parent_id=root.id,
            title=node_defs[0]["title"],
            description=node_defs[0]["description"],
            is_completed=1 if p1 >= 95.0 else 0,
            progress_pct=p1,
            embedding_json=json.dumps(emb1)
        )
        child2 = DAGNode(
            job_id=job_id,
            parent_id=root.id,
            title=node_defs[1]["title"],
            description=node_defs[1]["description"],
            is_completed=1 if p2 >= 95.0 else 0,
            progress_pct=p2,
            embedding_json=json.dumps(emb2)
        )
        child3 = DAGNode(
            job_id=job_id,
            parent_id=root.id,
            title=node_defs[2]["title"],
            description=node_defs[2]["description"],
            is_completed=1 if p3 >= 95.0 else 0,
            progress_pct=p3,
            embedding_json=json.dumps(emb3)
        )
        db.add(child1)
        db.add(child2)
        db.add(child3)
        db.commit()
        
        return root

    @staticmethod
    def get_dag(db: Session, job_id: str):
        return db.query(DAGNode).filter(DAGNode.job_id == job_id).all()
