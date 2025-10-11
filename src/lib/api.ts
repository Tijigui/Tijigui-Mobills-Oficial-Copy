import { toast } from 'sonner';

const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.error("VITE_API_URL is not defined in your .env file");
    toast.error("A URL da API não está configurada.");
    throw new Error("API URL not configured");
  }
  return apiUrl;
};

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const handleResponse = async (response: Response) => {
  if (response.ok) {
    // Handle cases with no content
    if (response.status === 204) {
      return null;
    }
    return response.json();
  } else {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    toast.error(errorData.message || 'Ocorreu um erro na requisição.');
    throw new Error(errorData.message || 'Request failed');
  }
};

const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async <T>(endpoint: string, body: any): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  del: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },
};

export default apiClient;