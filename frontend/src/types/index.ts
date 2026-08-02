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
  metrics?: ComputedMetricDTO;
  alignment_score?: GoalAlignmentScoreDTO;
  recommendations: RecommendedChannelDTO[];
  categories?: TopicCategoryBreakdownDTO[];
  hourly_heatmap?: HourlyAlignmentDTO[];
  nudges?: BehavioralNudgeDTO[];
}

