import { useState, useCallback } from 'react';
import axios from 'axios'; // Import axios

const useFetchData = (authToken) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (url, config = {}) => { // config is axios config object
    setLoading(true);
    setError(null);
    setData(null);

    console.log('[useFetchData - Axios] Attempting to fetch from URL:', url);
    console.log('[useFetchData - Axios] Auth token present:', !!authToken);

    const headers = {
      'Accept': 'application/json',
      ...config.headers, // Allow overriding/adding headers from caller
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await axios({
        url: url,
        method: config.method || 'GET', // Default to GET
        headers: headers,
        data: config.data, // For POST, PUT, PATCH requests
        params: config.params, // For URL query parameters
        ...config, // Spread other axios config options
      });

      console.log('[useFetchData - Axios] Response Status:', response.status);
      console.log('[useFetchData - Axios] Response Content-Type:', response.headers['content-type']);
      
      // Axios throws an error for non-2xx status codes by default,
      // so we typically expect to be in the .then() block for successful responses.
      // The .catch() block will handle HTTP errors.

      setData(response.data); // Axios automatically parses JSON response
      console.log('[useFetchData - Axios] Successfully received and parsed response.');

    } catch (err) {
      console.error('[useFetchData - Axios] Error during request:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('[useFetchData - Axios] Server Error Data:', err.response.data);
        console.error('[useFetchData - Axios] Server Error Status:', err.response.status);
        console.error('[useFetchData - Axios] Server Error Headers:', err.response.headers);
        
        let errorMessage = `Request failed with status ${err.response.status}.`;
        if (err.response.data) {
          if (typeof err.response.data === 'string' && err.response.data.toLowerCase().includes('<!doctype html>')) {
            errorMessage += ` Server returned an HTML page (e.g., "Cannot GET ${err.config.url.replace(err.config.baseURL || '', '')}"). Check backend routing.`;
            // You can try to extract the <pre> content if it's always the same structure
            const preMatch = err.response.data.match(/<pre>([\s\S]*?)<\/pre>/i);
            if (preMatch && preMatch[1]) {
                errorMessage += ` Specific error: ${preMatch[1]}`;
            }

          } else if (err.response.data.message) {
            errorMessage += ` Message: ${err.response.data.message}`;
          } else if (err.response.data.error) {
            errorMessage += ` Error: ${err.response.data.error}`;
          } else if (typeof err.response.data === 'object') {
            errorMessage += ` Details: ${JSON.stringify(err.response.data)}`;
          }
        }
        setError(errorMessage);

      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser
        console.error('[useFetchData - Axios] No response received:', err.request);
        setError('No response received from server. Check network or server status.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[useFetchData - Axios] Error setting up request:', err.message);
        setError(`Error setting up request: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const clear = () => {
    setData(null);
    setError(null);
  };

  return { data, loading, error, makeRequest, clear };
};

export default useFetchData;