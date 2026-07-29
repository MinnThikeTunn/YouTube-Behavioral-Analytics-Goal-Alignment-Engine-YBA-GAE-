import pytest
import numpy as np
from app.services.goal_alignment import GoalAlignmentEngine

def test_compute_text_embedding():
    vec = GoalAlignmentEngine.compute_text_embedding("Software Engineering")
    assert isinstance(vec, np.ndarray)
    assert vec.shape == (384,)

def test_weighted_similarity_alignment():
    goal_vec = GoalAlignmentEngine.compute_text_embedding("Software Engineering & Python Development")
    
    # Coding content
    sim_coding = GoalAlignmentEngine.compute_weighted_similarity(
        goal_vec,
        channel_text="freeCodeCamp.org Learn to code for free",
        topic_text="Computer programming Software engineering",
        video_text="Python Data Structures and Algorithms Tutorial"
    )

    # Cooking content
    sim_cooking = GoalAlignmentEngine.compute_weighted_similarity(
        goal_vec,
        channel_text="Gordon Ramsay Cooking Channel",
        topic_text="Food Cooking Cuisine",
        video_text="How to Make the Perfect Beef Wellington"
    )

    # Coding similarity must be significantly higher than cooking similarity
    assert sim_coding > sim_cooking
    assert sim_coding > 0.40
    assert sim_cooking < 0.20
