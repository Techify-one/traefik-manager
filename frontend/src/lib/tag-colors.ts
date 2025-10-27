/**
 * Generate a consistent color for a tag based on its name
 */
export function getTagColor(tagName: string): string {
  const colors = [
    'bg-red-100 text-red-800 border-red-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-lime-100 text-lime-800 border-lime-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-sky-100 text-sky-800 border-sky-200',
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-violet-100 text-violet-800 border-violet-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-rose-100 text-rose-800 border-rose-200',
  ];

  // Generate a hash from the tag name for consistency
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Tag badge component classes
 */
export function getTagBadgeClasses(tagName: string): string {
  const colorClasses = getTagColor(tagName);
  return `inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${colorClasses}`;
}
