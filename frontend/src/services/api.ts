import axios from 'axios';
import {
  UploadResponseDTO, JobStatusResponseDTO, AnalyticsResultDTO,
  CommentMiningRequestDTO, CommentMiningResponseDTO, ClosedLoopResponseDTO,
  ThumbnailVisionResultDTO, ChannelIntentDistributionDTO, Composite8FactorScoreDTO,
  ClosedLoopSyncRequestDTO, ClosedLoopTelemetryResultDTO
} from '../types';



const API_BASE_URL = '/api/v1';

export const uploadWatchHistory = async (
  file: File,
  goalText: string,
  userApiKey?: string
): Promise<UploadResponseDTO> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('goal_text', goalText);
  if (userApiKey) {
    formData.append('api_key', userApiKey);
  }

  const response = await axios.post<UploadResponseDTO>(
    `${API_BASE_URL}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatusResponseDTO> => {
  const response = await axios.get<JobStatusResponseDTO>(
    `${API_BASE_URL}/jobs/${jobId}/status`
  );
  return response.data;
};

export const getAnalyticsResults = async (jobId: string): Promise<AnalyticsResultDTO> => {
  const response = await axios.get<AnalyticsResultDTO>(
    `${API_BASE_URL}/analytics/${jobId}`
  );
  return response.data;
};

export const updateJobGoal = async (jobId: string, goalText: string): Promise<{ status: string; job_id: string; goal_text: string }> => {
  const response = await axios.patch(
    `${API_BASE_URL}/jobs/${jobId}/goal`,
    { goal_text: goalText }
  );
  return response.data;
};


export const getVelocityAnalytics = async (jobId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/analytics/${jobId}/velocity`
  );
  return response.data;
};

export const getCohortAnalytics = async (jobId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/analytics/${jobId}/cohort`
  );
  return response.data;
};

export const getTaxonomyGraph = async (jobId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/taxonomy/${jobId}`
  );
  return response.data;
};

export const mineVideoComments = async (payload: CommentMiningRequestDTO): Promise<CommentMiningResponseDTO> => {
  const response = await axios.post<CommentMiningResponseDTO>(
    `${API_BASE_URL}/creator/comments`,
    payload
  );
  return response.data;
};

export const getMinedComments = async (videoId: string): Promise<CommentMiningResponseDTO> => {
  const response = await axios.get<CommentMiningResponseDTO>(
    `${API_BASE_URL}/creator/comments/${videoId}`
  );
  return response.data;
};

export const getNicheTrends = async (): Promise<any> => {
  const response = await axios.get(
    `${API_BASE_URL}/creator/trends`
  );
  return response.data;
};

export const getVideoOpportunities = async (): Promise<any> => {
  const response = await axios.get(
    `${API_BASE_URL}/creator/opportunity`
  );
  return response.data;
};

export const evaluateVAS = async (payload: {
  title: string;
  hook_script: string;
  thumbnail_brightness?: number;
  thumbnail_contrast?: number;
}): Promise<any> => {
  const response = await axios.post(
    `${API_BASE_URL}/creator/vas-eval`,
    payload
  );
  return response.data;
};

export const evaluateDetailedVAS = async (payload: {
  title: string;
  hook_script: string;
  thumbnail_brightness?: number;
  thumbnail_contrast?: number;
}): Promise<any> => {
  const response = await axios.post(
    `${API_BASE_URL}/creator/vas-analysis`,
    payload
  );
  return response.data;
};


export const getClosedLoopTelemetry = async (): Promise<ClosedLoopResponseDTO> => {
  const response = await axios.get<ClosedLoopResponseDTO>(
    `${API_BASE_URL}/creator/closed-loop`
  );
  return response.data;
};

export const analyzeThumbnailImage = async (file: File): Promise<ThumbnailVisionResultDTO> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post<ThumbnailVisionResultDTO>(
    `${API_BASE_URL}/creator/thumbnail-analyze`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const getChannelIntentDistribution = async (channelHandle?: string): Promise<ChannelIntentDistributionDTO> => {
  const params: Record<string, string> = {};
  if (channelHandle) {
    params.channel_handle = channelHandle;
  }
  const response = await axios.get<ChannelIntentDistributionDTO>(
    `${API_BASE_URL}/creator/channel-intent-distribution`,
    { params }
  );
  return response.data;
};

export const computeCompositeScore = async (payload: {
  title: string;
  hook_script: string;
  thumbnail_brightness?: number;
  thumbnail_contrast?: number;
}): Promise<Composite8FactorScoreDTO> => {
  const response = await axios.post<Composite8FactorScoreDTO>(
    `${API_BASE_URL}/creator/composite-score`,
    payload
  );
  return response.data;
};

export const syncClosedLoopTelemetry = async (
  payload: ClosedLoopSyncRequestDTO
): Promise<ClosedLoopTelemetryResultDTO> => {
  const response = await axios.post<ClosedLoopTelemetryResultDTO>(
    `${API_BASE_URL}/creator/closed-loop/sync`,
    payload
  );
  return response.data;
};


