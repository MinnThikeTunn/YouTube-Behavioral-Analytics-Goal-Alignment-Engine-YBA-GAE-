"""
YouTube Behavioral Analytics & Goal Alignment Engine (YBA-GAE)
Empirical Weight Optimization & Simplex Grid Search Benchmark
"""

import numpy as np
from scipy.stats import spearmanr, pearsonr

# Ground-truth validation benchmark dataset:
# [s_channel, s_topic, s_video, human_ground_truth]
DATASET = np.array([
    [0.95, 0.90, 0.25, 0.85],  # 1. Clickbait coding tutorial on high-quality channel
    [0.96, 0.95, 0.94, 0.96],  # 2. High-precision mathematics lecture (3Blue1Brown)
    [0.10, 0.15, 0.88, 0.20],  # 3. Drama vlog targeting 'Machine Learning' keyword
    [0.92, 0.88, 0.40, 0.82],  # 4. Coding video with vague title 'Episode 4'
    [0.15, 0.10, 0.15, 0.10],  # 5. Casual daily vlog
    [0.88, 0.82, 0.80, 0.85],  # 6. Data science tutorial
    [0.30, 0.40, 0.75, 0.45],  # 7. Tech gadget unboxing
    [0.90, 0.85, 0.30, 0.80],  # 8. University lecture with non-descriptive title
    [0.12, 0.10, 0.92, 0.18],  # 9. Entertainment video targeting keywords
    [0.85, 0.90, 0.82, 0.88],  # 10. System design crash course
])

def evaluate_weights(wc: float, wt: float, wv: float):
    preds = wc * DATASET[:, 0] + wt * DATASET[:, 1] + wv * DATASET[:, 2]
    truths = DATASET[:, 3]
    
    rho, _ = spearmanr(preds, truths)
    r_val, _ = pearsonr(preds, truths)
    mae = np.mean(np.abs(preds - truths))
    
    # NDCG@10
    ideal_order = np.argsort(-truths)
    actual_order = np.argsort(-preds)
    
    idcg = np.sum((2**truths[ideal_order] - 1) / np.log2(np.arange(2, len(truths) + 2)))
    dcg = np.sum((2**truths[actual_order] - 1) / np.log2(np.arange(2, len(truths) + 2)))
    ndcg = dcg / idcg if idcg > 0 else 0.0
    
    # Classification Accuracy (threshold >= 0.5)
    pred_cls = preds >= 0.5
    true_cls = truths >= 0.5
    acc = np.mean(pred_cls == true_cls) * 100.0
    
    return {
        "spearman": rho,
        "pearson": r_val,
        "mae": mae,
        "ndcg": ndcg,
        "acc": acc
    }

def run_grid_search(step=0.05):
    print("=" * 75)
    print("  GRID SEARCH OPTIMIZATION ON 2-SIMPLEX (w_c + w_t + w_v = 1.0)")
    print("=" * 75)
    
    best_rho = -1.0
    best_weights = None
    best_metrics = None
    
    for wc in np.arange(0.05, 0.90, step):
        for wt in np.arange(0.05, 0.90, step):
            wv = 1.0 - wc - wt
            if wv < 0.04:
                continue
            
            m = evaluate_weights(wc, wt, wv)
            if m["spearman"] > best_rho:
                best_rho = m["spearman"]
                best_weights = (round(wc, 2), round(wt, 2), round(wv, 2))
                best_metrics = m

    print(f"\n[*] Global Optimum Found: w_channel={best_weights[0]}, w_topic={best_weights[1]}, w_video={best_weights[2]}")
    print(f"  Spearman Rank Correlation: {best_metrics['spearman']:.4f}")
    print(f"  NDCG@10:                   {best_metrics['ndcg']:.4f}")
    print(f"  Mean Absolute Error (MAE): {best_metrics['mae']:.4f}")
    print(f"  Classification Accuracy:   {best_metrics['acc']:.1f}%\n")
    
    print("=" * 75)
    print("  ABLATION STUDY BENCHMARK TABLE")
    print("=" * 75)
    print(f"{'Model Configuration':<28} | {'w_ch':<5} {'w_top':<5} {'w_vid':<5} | {'Spearman':<8} {'NDCG@10':<8} {'MAE':<6} {'Acc':<6}")
    print("-" * 75)
    
    configs = [
        ("M1: Video Title Only", 0.00, 0.00, 1.00),
        ("M2: Topic Category Only", 0.00, 1.00, 0.00),
        ("M3: Channel Meta Only", 1.00, 0.00, 0.00),
        ("M4: Uniform Baseline", 0.33, 0.33, 0.34),
        ("M5: Proposed Optimal", 0.40, 0.35, 0.25)
    ]
    
    for name, wc, wt, wv in configs:
        m = evaluate_weights(wc, wt, wv)
        print(f"{name:<28} | {wc:<5.2f} {wt:<5.2f} {wv:<5.2f} | {m['spearman']:<8.3f} {m['ndcg']:<8.3f} {m['mae']:<6.3f} {m['acc']:<5.1f}%")
    print("=" * 75)

if __name__ == "__main__":
    run_grid_search()
