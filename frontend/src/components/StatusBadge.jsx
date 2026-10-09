import React from 'react';
import { Badge } from 'react-bootstrap';

export const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-active';

  switch (status) {
    case 'ACTIVE':
    case 'SUCCESS':
      badgeClass = 'badge-active';
      break;
    case 'PAUSED':
      badgeClass = 'badge-paused';
      break;
    case 'DISABLED':
      badgeClass = 'badge-disabled';
      break;
    case 'FAILED':
      badgeClass = 'badge-failed-status';
      break;
    case 'RUNNING':
      badgeClass = 'badge-running-status';
      break;
    default:
      badgeClass = 'badge-active';
  }

  return (
    <Badge className={`px-2.5 py-1.5 rounded-pill font-semibold ${badgeClass}`}>
      {status}
    </Badge>
  );
};
