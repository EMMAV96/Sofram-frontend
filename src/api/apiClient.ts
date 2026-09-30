import { getStoredToken } from './tokenStorage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipUnauthorizedHandler?: boolean;
};

let unauthorizedHandler: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler;
}

function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'La solicitud no es válida.';
    case 401:
      return 'La sesión no es válida o ha expirado.';
    case 403:
      return 'No tiene autorización para realizar esta acción.';
    case 404:
      return 'El recurso solicitado no existe.';
    case 500:
      return 'El servidor encontró un error. Intente nuevamente más tarde.';
    default:
      return 'No fue posible completar la solicitud.';
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

async function requestResponse(path: string, options: RequestOptions = {}): Promise<Response> {
  const { body, skipUnauthorizedHandler, headers, ...requestInit } = options;
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await readResponseBody(response);
    if (response.status === 401 && !skipUnauthorizedHandler) unauthorizedHandler?.();

    const detail = typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody
      ? String(responseBody.message)
      : getErrorMessage(response.status);
    throw new ApiError(response.status, detail, responseBody);
  }

  return response;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return await readResponseBody(await requestResponse(path, options)) as T;
}

export interface BlobResponse {
  blob: Blob;
  contentDisposition: string | null;
}

export async function apiRequestBlob(path: string, options: RequestOptions = {}): Promise<BlobResponse> {
  const response = await requestResponse(path, {
    ...options,
    headers: { Accept: 'application/pdf', ...options.headers },
  });
  return { blob: await response.blob(), contentDisposition: response.headers.get('Content-Disposition') };
}
