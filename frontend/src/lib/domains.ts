export function sanitizeDomain(domain: string) {
  return domain.replace(/^(https?:\/\/)?(www\.)?(\*\.)?/, '').replace(/[\/\?#].*$/, '').trim();
}

export function generateFilename(domain: string) {
  const sanitized = sanitizeDomain(domain);
  return sanitized.replace(/\s+/g, '');
}

export function ensureYamlExtension(filename: string) {
  return filename.endsWith('.yml') ? filename : `${filename}.yml`;
}
