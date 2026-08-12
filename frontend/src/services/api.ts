import axios from 'axios';
import { UploadResponseDTO, JobStatusResponseDTO, AnalyticsResultDTO, CommentMiningRequestDTO, CommentMiningResponseDTO } from '../types';

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
