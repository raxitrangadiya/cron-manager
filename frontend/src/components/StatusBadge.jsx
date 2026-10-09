import React from 'react';
import { Badge } from 'react-bootstrap';

export const StatusBadge = ({ status }) => {
  let bg = 'success';

  switch (status) {
    case 'ACTIVE':
    case 'SUCCESS':
      bg = 'success';
      break;
    case 'PAUSED':
      bg = 'warning';
      break;
    case 'DISABLED':
      bg = 'secondary';
      break;
    case 'FAILED':
      bg = 'danger';
      break;
    case 'RUNNING':
      bg = 'info';
      break;
    default:
      bg = 'primary';
  }

  return (
    <Badge bg={bg} className="px-2.5 py-1.5 rounded-pill font-semibold">
      {status}
    </Badge>
  );
};
