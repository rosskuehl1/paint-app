const normalizeHandle = (rawHandle: string): string => {
  const trimmed = rawHandle.trim();
  if (!trimmed) {
    return '';
  }

  const withoutSymbol = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
  return withoutSymbol.replace(/[^a-zA-Z0-9_]/g, '');
};

export interface CashAppConfig {
  handle: string;
  cashtag: string;
  url: string;
}

/**
 * Returns Cash App configuration derived from environment variables.
 */
export const getCashAppConfig = (): CashAppConfig => {
  const rawHandle = import.meta.env.VITE_CASHAPP_HANDLE || 'RossKuehl';
  const handle = normalizeHandle(rawHandle);

  if (!handle) {
    return {
      handle: '',
      cashtag: '',
      url: 'https://cash.app',
    };
  }

  const cashtag = `$${handle}`;
  const url = `https://cash.app/${cashtag}`;

  return {
    handle,
    cashtag,
    url,
  };
};
