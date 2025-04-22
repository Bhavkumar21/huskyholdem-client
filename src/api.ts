import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8002',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const get = async (url: string, params?: Record<string, unknown>) => {
    try {
        const response = await apiClient.get(url, { params });
        return response.data;
    } catch (error) {
        console.error('GET request failed:', error);
        throw error;
    }
};

export const post = async <T>(url: string, data: T) => {
    try {
        const response = await apiClient.post(url, data);
        return response.data;
    } catch (error) {
        console.error('POST request failed:', error);
        throw error;
    }
};

export const put = async <T>(url: string, data: T) => {
    try {
        const response = await apiClient.put(url, data);
        return response.data;
    } catch (error) {
        console.error('PUT request failed:', error);
        throw error;
    }
};

export const del = async (url: string) => {
    try {
        const response = await apiClient.delete(url);
        return response.data;
    } catch (error) {
        console.error('DELETE request failed:', error);
        throw error;
    }
};

export {
    apiClient,
}