export async function apiGet(url) {
  const response = await fetch(url, { credentials: 'include' });
  return handleResponse(response);
}

export async function apiPost(url, body) {
  return apiRequest(url, 'POST', body);
}

export async function apiRequest(url, method, body) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return handleResponse(response);
}

async function handleResponse(response) {
  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error('Resposta inválida do servidor');
  }

  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Erro inesperado');
  }

  return json;
}
