type Status = 'pending' | 'approved' | 'rejected' | 'hold';

const styles: Record<Status, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  hold: 'bg-gray-100 text-gray-700',
};

export default function StatusBadge({ status }: { status: string }) {
  const baseStyle = 'px-2 py-1 text-xs font-semibold rounded-full';

  const isValidStatus = (status: string): status is Status =>
    ['pending', 'approved', 'rejected', 'hold'].includes(status);

  return (
    <span className={`${baseStyle} ${isValidStatus(status) ? styles[status] : 'bg-gray-300 text-gray-700'}`}>
      {status}
    </span>
  );
}
