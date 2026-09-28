export function formatRelativeTime(dateString) {
  if (!dateString) return "just now";
  const then = new Date(dateString).getTime();
  const now = Date.now();
  if (isNaN(then) || then <= 0 || then > now) return "just now";
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}