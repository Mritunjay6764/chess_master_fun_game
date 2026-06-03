import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PORT = parseInt(process.env.EXPO_PUBLIC_API_PORT ?? '3001', 10);
const API_HOST_OVERRIDE = (process.env.EXPO_PUBLIC_API_HOST ?? '').trim();
const API_SCHEME = (process.env.EXPO_PUBLIC_API_SCHEME ?? 'http').trim();
const API_BASE_URL_OVERRIDE = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();
const IS_PRODUCTION = API_SCHEME === 'https';

// Hardcode your machine's LAN IP here for local dev on physical devices.
const HARDCODED_HOST = '10.13.132.17';

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');
const toHttpUrl = (host: string): string => `http://${host}:${PORT}`;
const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));
const IPV4_HOST_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

const normalizeHost = (rawHost: string): string => {
  const withoutScheme = rawHost.replace(/^[a-z]+:\/\//i, '');
  const withoutPath = withoutScheme.split('/')[0];
  if (withoutPath.startsWith('[')) {
    const bracketIndex = withoutPath.indexOf(']');
    return bracketIndex >= 0 ? withoutPath.slice(1, bracketIndex) : withoutPath;
  }
  const parts = withoutPath.split(':');
  return parts[0] ?? withoutPath;
};

const isDirectDevHost = (host: string): boolean => {
  const normalized = normalizeHost(host).toLowerCase();
  return (
    IPV4_HOST_RE.test(normalized) ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '10.0.2.2' ||
    normalized.endsWith('.local')
  );
};

const getFallbackHost = (): string => {
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
};

const getDetectedHost = (): string | null => {
  const manifest = (Constants as any)?.manifest || (Constants as any)?.manifest2 || {};
  const expoConfig = (Constants as any)?.expoConfig || {};
  const expoGoConfig = (Constants as any)?.expoGoConfig || {};
  const host =
    manifest?.debuggerHost || manifest?.hostUri ||
    expoGoConfig?.debuggerHost || expoGoConfig?.hostUri ||
    expoConfig?.hostUri || expoConfig?.extra?.debuggerHost;
  if (typeof host === 'string') {
    const normalized = normalizeHost(host);
    if (isDirectDevHost(normalized)) return normalized;
  }
  return null;
};

const buildBaseUrl = (host: string): string =>
  IS_PRODUCTION
    ? `https://${host}`
    : `http://${host}:${PORT}`;

const getHost = (): string => {
  if (API_HOST_OVERRIDE) return API_HOST_OVERRIDE;
  if (IS_PRODUCTION) return API_HOST_OVERRIDE || 'api.chessmaster.app';
  if (HARDCODED_HOST) return HARDCODED_HOST;
  const detected = getDetectedHost();
  if (detected) return detected;
  return getFallbackHost();
};

const HOST = getHost();
const AUTO_BASE_URL = buildBaseUrl(HOST);
const BASE_URL = API_BASE_URL_OVERRIDE ? normalizeBaseUrl(API_BASE_URL_OVERRIDE) : AUTO_BASE_URL;
const detectedHost = getDetectedHost();

const SOCKET_URL_CANDIDATES = IS_PRODUCTION
  ? [BASE_URL]
  : unique([
      BASE_URL,
      ...(detectedHost ? [toHttpUrl(detectedHost)] : []),
      API_HOST_OVERRIDE ? toHttpUrl(API_HOST_OVERRIDE) : '',
      HARDCODED_HOST ? toHttpUrl(HARDCODED_HOST) : '',
      toHttpUrl(getFallbackHost()),
      toHttpUrl('localhost'),
      toHttpUrl('127.0.0.1'),
    ]);

const SOCKET_URL = SOCKET_URL_CANDIDATES[0] || BASE_URL;

export const API_CONFIG = {
  BASE_URL,
  SOCKET_URL,
  SOCKET_URL_CANDIDATES,
  TIMEOUT_MS: 15_000,
};
