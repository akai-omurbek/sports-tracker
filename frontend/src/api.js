const GAS_URL = process.env.REACT_APP_GAS_URL || '';
const API_KEY = process.env.REACT_APP_API_KEY || '';

function gasUrl(extra = {}) {
  const params = new URLSearchParams({ ...extra, ...(API_KEY ? { key: API_KEY } : {}) });
  return `${GAS_URL}?${params}`;
}

function parsePath(path) {
  // '/api/activities'      → { resource: 'activities', id: null }
  // '/api/activities/123'  → { resource: 'activities', id: '123' }
  const clean = path.replace(/^\/api\//, '');
  const slash = clean.indexOf('/');
  if (slash === -1) return { resource: clean, id: null };
  return { resource: clean.slice(0, slash), id: clean.slice(slash + 1) };
}

async function gasGet(resource) {
  const resp = await fetch(gasUrl({ resource }));
  const data = await resp.json();
  return { data };
}

async function gasPost(body) {
  const resp = await fetch(gasUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return { data };
}

const api = {
  get(path) {
    const { resource } = parsePath(path);
    return gasGet(resource);
  },
  post(path, body) {
    const { resource } = parsePath(path);
    return gasPost({ _resource: resource, ...body });
  },
  put(path, body) {
    const { resource, id } = parsePath(path);
    return gasPost({ _resource: resource, _method: 'PUT', _id: id, ...body });
  },
  delete(path) {
    const { resource, id } = parsePath(path);
    return gasPost({ _resource: resource, _method: 'DELETE', _id: id });
  },
};

export default api;
