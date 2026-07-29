import axios from 'axios';
import { UploadResponseDTO, JobStatusResponseDTO, AnalyticsResultDTO } from '../types';

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
