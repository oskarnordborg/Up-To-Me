import Axios from "axios";

const BASE_URL = "http://localhost:8000"; // Replace with your backend's base URL

const apiClient = Axios.create({
  baseURL: BASE_URL,
});

const FastApiClient = () => {
  const fetchData = async () => {
    try {
      const response = await apiClient.get("/api/data"); // Replace with your API endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const postData = async (data: any) => {
    try {
      const response = await apiClient.post("/api/data", data); // Replace with your API endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  };
};

export default FastApiClient;
