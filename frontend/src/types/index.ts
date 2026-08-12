export type JobStatus = 'QUEUED' | 'PROCESSING' | 'QUOTA_PAUSED' | 'COMPLETED' | 'FAILED';

export interface UploadResponseDTO {
  job_id: string;
  status: JobStatus;
  message: string;
  created_at: string;
}

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
}

export interface VideoOpportunityDTO {
  topic: string;
  demand_index: number;
  competitor_density: number;
  vos_score: number;
  opportunity_tier: string;
  recommended_titles: string[];
}

export interface ContentGapMatrixResponseDTO {
  opportunities: VideoOpportunityDTO[];
  avg_vos_score: number;
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
