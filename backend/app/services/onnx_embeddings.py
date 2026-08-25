import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

class ONNXEmbeddingScorer:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = None
            cls._instance.ort_session = None
            cls._instance.tokenizer = None
            cls._instance._attempted_load = False
            cls._instance._cache = {}
        return cls._instance

    def _ensure_model(self):
        if self.model is None and self.ort_session is None and not self._attempted_load:
            self._attempted_load = True
            
            # 1. Attempt onnxruntime load if quantized onnx file exists
            try:
                import onnxruntime as ort
                from transformers import AutoTokenizer
                onnx_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "model_quantized.onnx")
                if os.path.exists(onnx_path):
                    self.ort_session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
                    self.tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')
                    logger.info("Loaded ONNX Runtime INT8 session successfully.")
            except Exception as e:
                logger.debug(f"ONNX Runtime initialization skipped: {e}")
                self.ort_session = None

            # 2. Transparent fallback to sentence_transformers
            if self.ort_session is None:
                try:
                    from sentence_transformers import SentenceTransformer
                    self.model = SentenceTransformer('all-MiniLM-L6-v2')
                    logger.info("Loaded PyTorch SentenceTransformer model fallback.")
                except Exception as e:
                    logger.warning(f"Embedding model fallback failed: {e}")
                    self.model = None

    def _cosine_similarity(self, a, b):
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def _encode_text(self, text: str) -> np.ndarray:
        if text in self._cache:
            return self._cache[text]

        if self.ort_session is not None and self.tokenizer is not None:
            try:
                inputs = self.tokenizer(text, padding=True, truncation=True, max_length=128, return_tensors="np")
                ort_inputs = {
                    'input_ids': inputs['input_ids'].astype(np.int64),
                    'attention_mask': inputs['attention_mask'].astype(np.int64)
                }
                if 'token_type_ids' in inputs and 'token_type_ids' in [x.name for x in self.ort_session.get_inputs()]:
                    ort_inputs['token_type_ids'] = inputs['token_type_ids'].astype(np.int64)
                
                outputs = self.ort_session.run(None, ort_inputs)
                # Mean pooling
                token_embeddings = outputs[0]
                mask = np.expand_dims(inputs['attention_mask'], -1)
                pooled = np.sum(token_embeddings * mask, axis=1) / np.clip(mask.sum(axis=1), a_min=1e-9, a_max=None)
                emb = pooled[0]
                self._cache[text] = emb
                return emb
            except Exception:
                pass

        if self.model is not None:
            emb = self.model.encode(text, convert_to_numpy=True)
            self._cache[text] = emb
            return emb

        return np.zeros((384,), dtype=np.float32)

    def score(self, text: str, goal_text: str) -> dict:
        self._ensure_model()
        if (not self.model and not self.ort_session) or not text.strip() or not goal_text.strip():
            return {"score": 75.0, "classification": "ALIGNED"}
            
        emb_text = self._encode_text(text)
        emb_goal = self._encode_text(goal_text)
        raw_sim = self._cosine_similarity(emb_text, emb_goal)
        
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

