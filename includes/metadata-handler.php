<?php
/**
 * Metadata Handler
 * Manage tags and metadata for domain configurations
 */

require_once __DIR__ . '/../config.php';

// Path to metadata file
define('METADATA_FILE', TRAEFIK_CONFIGS_PATH . '/.metadata.json');

/**
 * Get metadata from file
 */
function getMetadata() {
    if (!file_exists(METADATA_FILE)) {
        // Create default metadata structure
        $defaultMetadata = [
            'tags' => [],
            'availableTags' => ['producao', 'desenvolvimento', 'teste', 'web', 'api', 'database']
        ];
        saveMetadata($defaultMetadata);
        return $defaultMetadata;
    }

    $content = file_get_contents(METADATA_FILE);
    $metadata = json_decode($content, true);

    // Ensure structure exists
    if (!isset($metadata['tags'])) {
        $metadata['tags'] = [];
    }
    if (!isset($metadata['availableTags'])) {
        $metadata['availableTags'] = [];
    }

    return $metadata;
}

/**
 * Save metadata to file
 */
function saveMetadata($metadata) {
    $json = json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents(METADATA_FILE, $json) !== false;
}

/**
 * Get tags for a specific file
 */
function getTags($filename) {
    $metadata = getMetadata();

    // Normalize filename (remove leading slash)
    $filename = ltrim($filename, '/');

    return $metadata['tags'][$filename] ?? [];
}

/**
 * Set tags for a specific file
 */
function setTags($filename, $tags) {
    // Normalize filename (remove leading slash)
    $filename = ltrim($filename, '/');

    // Ensure tags is an array
    if (!is_array($tags)) {
        return false;
    }

    // Remove duplicates and empty values
    $tags = array_values(array_unique(array_filter($tags, function($tag) {
        return !empty(trim($tag));
    })));

    $metadata = getMetadata();

    if (empty($tags)) {
        // Remove entry if no tags
        unset($metadata['tags'][$filename]);
    } else {
        $metadata['tags'][$filename] = $tags;
    }

    return saveMetadata($metadata);
}

/**
 * Get all available tags
 */
function getAllAvailableTags() {
    $metadata = getMetadata();
    return $metadata['availableTags'] ?? [];
}

/**
 * Add a new available tag
 */
function addAvailableTag($tag) {
    $tag = trim($tag);

    if (empty($tag)) {
        return false;
    }

    $metadata = getMetadata();

    // Check if tag already exists
    if (in_array($tag, $metadata['availableTags'])) {
        return true; // Already exists, consider it success
    }

    $metadata['availableTags'][] = $tag;

    // Sort tags alphabetically
    sort($metadata['availableTags']);

    return saveMetadata($metadata);
}

/**
 * Remove an available tag
 */
function removeAvailableTag($tag) {
    $metadata = getMetadata();

    // Remove from available tags
    $metadata['availableTags'] = array_values(array_filter(
        $metadata['availableTags'],
        function($t) use ($tag) {
            return $t !== $tag;
        }
    ));

    // Remove from all files
    foreach ($metadata['tags'] as $filename => $fileTags) {
        $metadata['tags'][$filename] = array_values(array_filter(
            $fileTags,
            function($t) use ($tag) {
                return $t !== $tag;
            }
        ));

        // Remove entry if no tags left
        if (empty($metadata['tags'][$filename])) {
            unset($metadata['tags'][$filename]);
        }
    }

    return saveMetadata($metadata);
}

/**
 * Get count of files using a specific tag
 */
function getTagUsageCount($tag) {
    $metadata = getMetadata();
    $count = 0;

    foreach ($metadata['tags'] as $fileTags) {
        if (in_array($tag, $fileTags)) {
            $count++;
        }
    }

    return $count;
}

/**
 * Remove tags for a deleted file
 */
function removeFileTags($filename) {
    // Normalize filename (remove leading slash)
    $filename = ltrim($filename, '/');

    $metadata = getMetadata();

    if (isset($metadata['tags'][$filename])) {
        unset($metadata['tags'][$filename]);
        return saveMetadata($metadata);
    }

    return true;
}

/**
 * Rename file tags when file is moved/renamed
 */
function renameFileTags($oldFilename, $newFilename) {
    // Normalize filenames
    $oldFilename = ltrim($oldFilename, '/');
    $newFilename = ltrim($newFilename, '/');

    $metadata = getMetadata();

    if (isset($metadata['tags'][$oldFilename])) {
        $metadata['tags'][$newFilename] = $metadata['tags'][$oldFilename];
        unset($metadata['tags'][$oldFilename]);
        return saveMetadata($metadata);
    }

    return true;
}
