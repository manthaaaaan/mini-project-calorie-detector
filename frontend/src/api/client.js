import axios from "axios";
import { auth } from "../firebase";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://10.140.177.60:8000";

const api = axios.create({ baseURL: BASE });

const getToken = async () => {
  try {
    const result = await FirebaseAuthentication.getIdToken();
    if (result.token) return result.token;
  } catch {}

  try {
    const user = auth.currentUser;
    if (user) return await user.getIdToken();
  } catch {}

  return null;
};

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchDashboard = (date) =>
  api.get("/api/dashboard/daily", { params: { date } }).then((r) => r.data);

export const fetchMeals = (date) =>
  api.get("/api/meals", { params: { date } }).then((r) => r.data);

export const analyzeMeal = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/api/meals/analyze", formData).then((r) => r.data);
};

export const createManualMeal = (payload) =>
  api.post("/api/meals/manual", payload).then((r) => r.data);

export const updateMeal = (mealId, payload) =>
  api.put(`/api/meals/${mealId}`, payload).then((r) => r.data);

export const deleteMeal = (mealId) =>
  api.delete(`/api/meals/${mealId}`).then((r) => r.data);

export const searchFoods = (query) =>
  api.get("/api/foods/search", { params: { query } }).then((r) => r.data);

export const fetchGoal = () =>
  api.get("/api/goals/daily").then((r) => r.data);

export const updateGoal = (calories_goal) =>
  api.put("/api/goals/daily", { calories_goal }).then((r) => r.data);