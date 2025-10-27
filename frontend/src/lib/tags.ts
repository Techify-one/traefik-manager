import { apiGet, apiPost } from './api';
import type { TagInfo, TagsListResponse } from '../types/domain';

/**
 * Fetch all available tags
 */
export async function fetchAvailableTags(): Promise<TagInfo[]> {
  const response = await apiGet<TagsListResponse>('/api/tags.php?action=list');
  return response.data.tags;
}

/**
 * Fetch tags for a specific file
 */
export async function fetchFileTags(filename: string): Promise<string[]> {
  const response = await apiGet<{ tags: string[] }>(
    `/api/tags.php?action=get&file=${encodeURIComponent(filename)}`
  );
  return response.data.tags;
}

/**
 * Update tags for a file
 */
export async function updateFileTags(filename: string, tags: string[]): Promise<void> {
  await apiPost('/api/tags.php', {
    action: 'set',
    filename,
    tags,
  });
}

/**
 * Create a new tag
 */
export async function createTag(tag: string): Promise<void> {
  await apiPost('/api/tags.php', {
    action: 'create',
    tag,
  });
}

/**
 * Delete a tag
 */
export async function deleteTag(tag: string): Promise<void> {
  await apiPost('/api/tags.php', {
    action: 'delete',
    tag,
  });
}
