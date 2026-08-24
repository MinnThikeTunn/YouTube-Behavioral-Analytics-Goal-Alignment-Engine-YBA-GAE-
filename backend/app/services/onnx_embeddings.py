import numpy as np

class ONNXEmbeddingScorer:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = None
            cls._instance._attempted_load = False
        return cls._instance

    def _ensure_model(self):
        if self.model is None and not self._attempted_load:
            self._attempted_load = True
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                self.model = None

    def _cosine_similarity(self, a, b):
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def score(self, text: str, goal_text: str) -> dict:
        self._ensure_model()
        if not self.model or not text.strip() or not goal_text.strip():
            return {"score": 75.0, "classification": "ALIGNED"}
            
        embeddings = self.model.encode([text, goal_text])
        raw_sim = self._cosine_similarity(embeddings[0], embeddings[1])
        
        # Scale raw similarity (0.0 to 1.0) into a 0 - 100 percentage score!
        scaled_score = float(np.clip((raw_sim / 0.35) * 100.0, 0.0, 100.0))
        
        if raw_sim >= 0.25 or scaled_score >= 60.0:
            classification = "ALIGNED"
        elif raw_sim >= 0.15 or scaled_score >= 35.0:
            classification = "NEUTRAL"
        else:
            classification = "DISTRACTING"
            
        return {"score": round(scaled_score, 1), "classification": classification}

onnx_scorer = ONNXEmbeddingScorer()
