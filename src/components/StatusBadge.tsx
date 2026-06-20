export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-[#DCFCE7] text-[#15803D]',
    approved: 'bg-[#DCFCE7] text-[#15803D]',
    pending: 'bg-[#FEF9C3] text-[#92400E]',
    expired: 'bg-[#F3F4F6] text-[#6B7280]',
    rejected: 'bg-[#FEE2E2] text-[#991B1B]',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}
