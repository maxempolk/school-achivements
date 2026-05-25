import axios from 'axios';

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const message = (error.response?.data as { message?: unknown } | undefined)
    ?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    const messages = message.filter((item) => typeof item === 'string');

    return messages.length > 0 ? messages.join(', ') : null;
  }

  return null;
}
