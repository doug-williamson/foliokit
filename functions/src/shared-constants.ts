export const ALLOWED_ORIGINS = ['https://foliokitcms.com', 'http://localhost:4202'];

export const RESERVED_SUBDOMAINS = [
  'www', 'admin', 'api', 'mail', 'ftp', 'blog', 'app', 'foliokitcms',
];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
