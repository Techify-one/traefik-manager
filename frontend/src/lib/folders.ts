import { apiGet, apiPost } from './api';
import type { FolderListResponse } from '../types/domain';

/**
 * Fetch all folders
 */
export async function fetchFolders(): Promise<string[]> {
  const response = await apiGet<FolderListResponse>('/api/domains.php?action=list-folders');
  return response.data.folders;
}

/**
 * Create a new folder
 */
export async function createFolder(folderPath: string): Promise<void> {
  await apiPost('/api/domains.php', {
    action: 'create-folder',
    folderPath,
  });
}

/**
 * Move a file to another folder
 */
export async function moveFile(filename: string, targetFolder: string): Promise<void> {
  await apiPost('/api/domains.php', {
    action: 'move',
    filename,
    targetFolder,
  });
}

/**
 * Delete an empty folder
 */
export async function deleteFolder(folderPath: string): Promise<void> {
  await apiPost('/api/domains.php', {
    action: 'delete-folder',
    folderPath,
  });
}
