import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

with open("D:/DAProject/watch-history.json", "r", encoding="utf-8") as f:
    records = json.load(f)

print(f"Total raw records in JSON: {len(records)}")

titles = []
for r in records:
    title = r.get("title", "")
    if title.startswith("Watched "):
        title = title[8:]
    if not title.startswith("http") and title.strip():
        titles.append(title.strip())

print(f"Total valid video titles extracted: {len(titles):,}")

model = SentenceTransformer("all-MiniLM-L6-v2")
goal_text = "Software Engineering"
goal_vec = model.encode(goal_text, convert_to_numpy=True).reshape(1, -1)

# Sample 1,000 titles for distribution check
sample_titles = titles[:1000]
title_vecs = model.encode(sample_titles, convert_to_numpy=True)
sims = cosine_similarity(goal_vec, title_vecs)[0]

print(f"\nSimilarity Stats for '{goal_text}':")
print(f" - Min Similarity:    {np.min(sims):.3f}")
print(f" - Max Similarity:    {np.max(sims):.3f}")
print(f" - Mean Similarity:   {np.mean(sims):.3f}")
print(f" - 75th Percentile:   {np.percentile(sims, 75):.3f}")

aligned_35 = np.sum(sims >= 0.35)
aligned_25 = np.sum(sims >= 0.25)
aligned_20 = np.sum(sims >= 0.20)

print(f"\nAligned Video Counts (out of 1,000 sampled):")
print(f" - At 0.35 threshold: {aligned_35} videos ({aligned_35/10:.1f}%)")
print(f" - At 0.25 threshold: {aligned_25} videos ({aligned_25/10:.1f}%)")
print(f" - At 0.20 threshold: {aligned_20} videos ({aligned_20/10:.1f}%)")

# Top matching titles
top_indices = np.argsort(sims)[::-1][:5]
print(f"\nTop 5 Most Aligned Titles in Your Watch History:")
for idx in top_indices:
    title_str = sample_titles[idx].encode("ascii", "ignore").decode("ascii")
    print(f" [{sims[idx]:.3f}] {title_str[:70]}")
