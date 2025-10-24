export function sanitizeDomain(domain) {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[\/\?].*$/, '')
    .trim();
}

export function generateFilename(domain) {
  return sanitizeDomain(domain).replace(/[^a-zA-Z0-9\-\.]+/g, '-').toLowerCase();
}

export function ensureYamlExtension(filename) {
  return filename.endsWith('.yml') || filename.endsWith('.yaml') ? filename : `${filename}.yml`;
}
