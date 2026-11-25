interface BadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
  classroom: 'bg-blue-100 text-blue-800',
  fablab: 'bg-purple-100 text-purple-800',
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style} ${className}`}>
      {status}
    </span>
  );
}
