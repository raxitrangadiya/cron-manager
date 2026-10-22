import React from 'react';

export const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-soft-neutral';

  switch (status) {
    case 'ACTIVE':
    case 'SUCCESS':
    case 'COMPLETED':
      badgeClass = 'badge-soft-success';
      break;
    case 'PAUSED':
      badgeClass = 'badge-soft-warning';
      break;
    case 'FAILED':
    case 'ERROR':
      badgeClass = 'badge-soft-danger';
      break;
    case 'RUNNING':
      badgeClass = 'badge-soft-info';
      break;
    case 'DISABLED':
    default:
      badgeClass = 'badge-soft-neutral';
  }

  return (
    <span className={`badge ${badgeClass} px-2.5 py-1 rounded-pill small`}>
      {status}
    </span>
  );
};
