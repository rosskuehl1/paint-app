const ensureLeadingSlash = (value: string): string =>
  value.startsWith('/') ? value : `/${value}`;

const ensureTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value : `${value}/`;

const getBasePath = (): string => {
  const rawBase = import.meta.env.BASE_URL || '/';
  const withLeadingSlash = ensureLeadingSlash(rawBase);
  return ensureTrailingSlash(withLeadingSlash);
};

/**
 * Builds an in-app path that respects the Vite base URL.
 */
export const buildAppPath = (path = ''): string => {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const basePath = getBasePath();
  return normalizedPath ? `${basePath}${normalizedPath}` : basePath;
};

/**
 * Builds an absolute URL for the application using the current window origin.
 */
export const buildAppUrl = (path = ''): string => {
  if (typeof window === 'undefined') {
    return buildAppPath(path);
  }

  const inAppPath = buildAppPath(path);
  return `${window.location.origin}${inAppPath}`;
};
