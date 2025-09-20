import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

export function adminHeaders() {
  return { "X-ADMIN-TOKEN": process.env.REACT_APP_ADMIN_TOKEN };
}


// -------------------- Reports --------------------
export async function getReports() {
  const { data } = await api.get(`/reports/`);
  return data;
}

export async function submitComplaint(payload) {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      fd.append(k, v);
    }
  });

  const { data } = await api.post(`/complaints/register`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// -------------------- AI Assist --------------------
export async function aiAssist({ title, description, category, department, urgency, image, address }) {
  const fd = new FormData();
  if (title) fd.append("title", title);
  if (description) fd.append("description", description);
  if (category) fd.append("category", category);
  if (department) fd.append("department", department);
  if (urgency) fd.append("urgency", urgency);
  if (image) fd.append("image", image);
  if (address) fd.append("address", address); // ✅ new line

  const { data } = await api.post(`/AIhelp/assist`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data
}


// -------------------- Admin --------------------
export async function adminListReports(params = {}) {
  const { data } = await api.get(`/admin/complaints`, {
    params,
    headers: adminHeaders(),
  });
  return data;
}
// -------------------- Admin --------------------
export async function updateProcess(id, process) {
  const { data } = await api.put(`/admin/complaints/${id}/process`, 
    { process }, 
    { headers: adminHeaders() }
  );
  return data;
}

export async function updateDepartment(id, department) {
  const { data } = await api.put(
    `/admin/complaints/${id}/department`,
    { department },
    { headers: adminHeaders() }
  );
  return data;
}



export { api };

