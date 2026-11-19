import { API_BASE_URL } from "./config.js";

async function request(path, method = "GET", body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(API_BASE_URL + path, options);
  } catch {
    throw new Error("Cannot reach the backend. Check the API URL and your internet connection.");
  }
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status}).`);
  if (data === null) throw new Error("The backend did not return JSON.");
  return data;
}

export const recordService = {
  list: () => request("/api/records"),
  get: id => request(`/api/records/${id}`),
  create: record => request("/api/records", "POST", record),
  update: (id, record) => request(`/api/records/${id}`, "PUT", record),
  remove: id => request(`/api/records/${id}`, "DELETE")
};
