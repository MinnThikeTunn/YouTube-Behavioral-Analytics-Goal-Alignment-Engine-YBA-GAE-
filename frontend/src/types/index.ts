export type JobStatus = 'QUEUED' | 'PROCESSING' | 'QUOTA_PAUSED' | 'COMPLETED' | 'FAILED';

export interface UploadResponseDTO {
  job_id: string;
  status: JobStatus;
  message: string;
  created_at: string;
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
  channel_id: string;
  channel_title: string;
  channel_description?: string;
  similarity_score: number;
}

export interface AnalyticsResultDTO {
  job_id: string;
  metrics?: ComputedMetricDTO;
  alignment_score?: GoalAlignmentScoreDTO;
  recommendations: RecommendedChannelDTO[];
}
