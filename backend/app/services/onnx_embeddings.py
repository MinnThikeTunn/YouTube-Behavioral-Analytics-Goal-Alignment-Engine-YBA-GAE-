import numpy as np

class ONNXEmbeddingScorer:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = None
            try:
                from sentence_transformers import SentenceTransformer
                cls._instance.model = SentenceTransformer('all-MiniLM-L6-v2')
            except ImportError:
                pass
        return cls._instance

    def _cosine_similarity(self, a, b):
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def score(self, text: str, goal_text: str) -> dict:
        if not self.model:
            # Fallback if model not available
            return {"score": 0.5, "classification": "ALIGNED"}
            
        embeddings = self.model.encode([text, goal_text])
        score = self._cosine_similarity(embeddings[0], embeddings[1])
        
        if score >= 0.40:
            classification = "ALIGNED"
        elif score >= 0.20:
            classification = "NEUTRAL"
        else:
            classification = "DISTRACTING"
            
        return {"score": score, "classification": classification}

onnx_scorer = ONNXEmbeddingScorer()
