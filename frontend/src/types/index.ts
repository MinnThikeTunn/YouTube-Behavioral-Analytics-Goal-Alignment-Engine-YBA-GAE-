export type JobStatus = 'QUEUED' | 'PROCESSING' | 'QUOTA_PAUSED' | 'COMPLETED' | 'FAILED';


export interface JobLogDTO {
  id: number;
  timestamp: string;
  stage: string;
  level: 'INFO' | 'CALCULATION' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  details_json?: string;
}

export interface JobStatusResponseDTO {
  job_id: string;
  status: JobStatus;
  progress_pct: number;
  total_records: number;
  video_records: number;
  community_post_records: number;
  ad_records: number;
  non_viewing_records: number;
  error_message?: string;
  completed_at?: string;
  logs?: JobLogDTO[];
}

export interface ComputedMetricDTO {
  focus_ratio: number;
  median_completion_prob: number;
  session_density: number;
  circadian_score: number;
  window_period: string;
}

export interface GoalAlignmentScoreDTO {
  alignment_probability_score: number;
  focus_ratio_weight: number;
  completion_weight: number;
  session_density_penalty: number;
  circadian_penalty: number;
}

export interface RecommendedChannelDTO {
  channel_id?: string;
  channel_title: string;
  channel_description?: string;
  similarity_score: number;
  category?: 'watched' | 'discovery';
  channel_url?: string;
}

export interface TopicCategoryBreakdownDTO {
  category_name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface HourlyAlignmentDTO {
  hour: number;
  formatted_hour: string;
  avg_similarity: number;
  click_count: number;
}

export interface BehavioralNudgeDTO {
  nudge_type: 'switching_alert' | 'focus_goalpost' | 'circadian_alert';
  severity: 'warning' | 'info' | 'action';
  title: string;
  message: string;
  swap_count?: number;
}

export interface AnalyticsResultDTO {
  job_id: string;
  goal_text?: string;
  metrics?: ComputedMetricDTO;
  alignment_score?: GoalAlignmentScoreDTO;
  recommendations: RecommendedChannelDTO[];
  categories?: TopicCategoryBreakdownDTO[];
  hourly_heatmap?: HourlyAlignmentDTO[];
  nudges?: BehavioralNudgeDTO[];
  focus_playlist_url?: string;
}


export interface SessionVelocityDTO {
  session_id: string;
  start_time: string;
  end_time: string;
  video_count: number;
  v_cog: number;
  fatigue_state: 'STABLE' | 'DECAYING' | 'FATIGUED';
}

export interface FatigueWindowDTO {
  start_time: string;
  end_time: string;
  trigger_reason: string;
  recommended_action: string;
}

export interface VelocityAnalyticsResponseDTO {
  job_id: string;
  sessions: SessionVelocityDTO[];
  fatigue_windows: FatigueWindowDTO[];
  overall_v_cog: number;
}

export interface CohortBenchmarkDTO {
  percentile_rank: number;
  cohort_tier: string;
  focus_streak_comparison: number;
  cohort_size: number;
  cohort_name: string;
}

export interface CohortAnalyticsResponseDTO {
  job_id: string;
  benchmark: CohortBenchmarkDTO;
  insights: string[];
}

export type CommentIntentEnum = 'REQUEST' | 'CONFUSION' | 'PRAISE' | 'DEBATE';

export interface MinedCommentDTO {
  comment_id: string;
  author_name?: string;
  text_display: string;
  like_count: number;
  published_at?: string;
  intent_label?: CommentIntentEnum;
  sentiment_score?: number;
}

export interface CommentMiningResponseDTO {
  video_id: string;
  total_mined: number;
  comments: MinedCommentDTO[];
}

export interface CommentMiningRequestDTO {
  video_id: string;
  max_results?: number;
}

export interface NicheTrendDTO {
  niche_name: string;
  trend_velocity: number;
  trajectory: 'EXPLODING' | 'RISING' | 'STABLE' | 'DECLINING';
  keyword_clusters: string[];
  delta_views: number;
  delta_uploads: number;
  sentiment_ratio: number;
}

export interface NicheTrendRadarResponseDTO {
  trends: NicheTrendDTO[];
  overall_market_sentiment: number;
  aligned_goal?: string;
}

export interface VideoOpportunityDTO {
  topic: string;
  demand_index: number;
  competitor_density: number;
  vos_score: number;
  opportunity_tier: string;
  recommended_titles: string[];
  goal_alignment_score?: number;
  title_match_scores?: number[];
  factor_scores?: FactorScoreDTO[];
}

export interface ContentGapMatrixResponseDTO {
  opportunities: VideoOpportunityDTO[];
  avg_vos_score: number;
  aligned_goal?: string;
}


export interface VASEvalRequestDTO {
  title: string;
  hook_script: string;
  thumbnail_brightness?: number;
  thumbnail_contrast?: number;
}

export interface VASEvalResponseDTO {
  overall_vas: number;
  title_score: number;
  thumbnail_score: number;
  hook_score: number;
  recommendations: string[];
  improved_title_ideas: string[];
}

export interface ClosedLoopResponseDTO {
  total_evaluations: number;
  tuned_weights: Record<string, number>;
  accuracy_pct: number;
  mean_absolute_error: number;
  recommendations: string[];
  status: string;
}

export interface ThumbnailVisionResultDTO {
  brightness: number;
  contrast: number;
  color_saturation: number;
  sharpness: number;
  color_balance: number;
  visual_impact_score: number;
  legibility_score: number;
  readability_grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  dominant_colors: string[];
}

export interface IntentDistributionBreakdownDTO {
  intent_label: 'REQUEST' | 'CONFUSION' | 'PRAISE' | 'DEBATE';
  count: number;
  percentage: number;
}

export interface TopicIntentHeatmapCellDTO {
  topic: string;
  intent_label: 'REQUEST' | 'CONFUSION' | 'PRAISE' | 'DEBATE';
  comment_count: number;
  heat_score: number;
}

export interface ChannelIntentDistributionDTO {
  total_comments_analyzed: number;
  total_videos_analyzed: number;
  distribution: IntentDistributionBreakdownDTO[];
  heatmap: TopicIntentHeatmapCellDTO[];
  top_feature_requests: string[];
  top_confusion_points: string[];
  channel_sentiment_index: number;
  mined_comments?: MinedCommentDTO[];
}

export interface FactorScoreDTO {
  factor_key: string;
  factor_name: string;
  score: number;
  weight: number;
  description: string;
}

export interface Composite8FactorScoreDTO {
  composite_overall_score: number;
  factors: FactorScoreDTO[];
}

export interface ClosedLoopSyncRequestDTO {
  evaluation_id?: number;
  actual_ctr: number;
  actual_retention_30s: number;
  actual_views: number;
}

export interface ClosedLoopTelemetryResultDTO {
  status: string;
  total_evaluations: number;
  tuned_weights: Record<string, number>;
  accuracy_pct: number;
  mean_absolute_error: number;
  weight_delta_w1: number;
  weight_delta_w2: number;
  weight_delta_w3: number;
  message: string;
}

export interface ABPackagingVariantDTO {
  variant_id: string;
  variant_label: string; // e.g. "Variant A (How-To Focus)"
  title: string;
  hook_script: string;
  thumbnail_brightness?: number;
  thumbnail_contrast?: number;
}

export interface ABPackagingRequestDTO {
  variants: ABPackagingVariantDTO[];
}

export interface ABPackagingResultDTO {
  variant_id: string;
  variant_label: string;
  title: string;
  overall_vas: number;
  title_score: number;
  thumbnail_score: number;
  hook_score: number;
  is_winner: boolean;
  predicted_ctr_uplift_pct: number;
  key_advantage: string;
  recommendations: string[];
}

export interface ABPackagingMatrixResponseDTO {
  winning_variant_id: string;
  best_overall_vas: number;
  variants: ABPackagingResultDTO[];
  comparison_summary: string;
}

export interface HookGenerationRequestDTO {
  title: string;
  topic?: string;
  target_audience?: string;
}

export interface HookScriptOptionDTO {
  hook_style: string; // "Curiosity Gap" | "Pain Point / Mistake" | "Story Hook"
  script_text: string;
  word_count: number;
  estimated_retention_pct: number;
  pacing_notes: string;
}

export interface HookGenerationResponseDTO {
  title: string;
  hooks: HookScriptOptionDTO[];
}



