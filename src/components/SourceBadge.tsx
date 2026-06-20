export function SourceBadge({ source }: { source: string }) {
  if (source === 'ai') {
    return (
      <span className="inline-flex items-center rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-xs font-semibold text-[#7C3AED]">
        AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      Manual
    </span>
  );
}
