import React from 'react';
import { Table, Button, Dropdown, Badge } from 'react-bootstrap';
import { Play, Pause, RefreshCw, MoreVertical, Edit2, Trash2, FileText, Calendar, Clock, Activity } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cronToHumanReadable } from '../utils/cronHumanizer';

export const CronJobTable = ({
  jobs,
  onEdit,
  onPause,
  onResume,
  onTrigger,
  onDelete,
  onViewLogs,
  onCreateNew
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-5 rounded-3 bg-white border custom-table-container">
        <div className="p-3 bg-light rounded-circle d-inline-flex text-muted mb-3">
          <Calendar size={32} />
        </div>
        <h6 className="fw-bold text-dark">No scheduled jobs found</h6>
        <p className="text-muted small mb-3">
          Get started by scheduling your first automated task or pick a template from the Pattern Master.
        </p>
        {onCreateNew && (
          <Button variant="primary" size="sm" onClick={onCreateNew}>
            + Schedule New Job
          </Button>
        )}
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return <span className="text-muted small">—</span>;
    const d = new Date(dateStr);
    return (
      <span title={d.toISOString()} className="text-dark small">
        {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
        {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  };

  const getJobTypeBadge = (jobType) => {
    switch (jobType) {
      case 'DAILY_SALES_REPORT':
        return <Badge bg="primary" bg-opacity="10" className="text-primary border border-primary border-opacity-25 fw-medium">Sales Report</Badge>;
      case 'EMAIL_NOTIFICATION':
        return <Badge bg="info" bg-opacity="10" className="text-info border border-info border-opacity-25 fw-medium">Email Dispatch</Badge>;
      case 'ENCRYPTION_ROTATION':
        return <Badge bg="warning" bg-opacity="10" className="text-warning border border-warning border-opacity-25 fw-medium">Key Rotation</Badge>;
      case 'LOG_CLEANUP':
        return <Badge bg="secondary" bg-opacity="10" className="text-secondary border border-secondary border-opacity-25 fw-medium">Log Purge</Badge>;
      default:
        return <Badge bg="light" text="dark" className="border fw-medium">{jobType}</Badge>;
    }
  };

  return (
    <div className="custom-table-container table-responsive">
      <Table hover className="custom-table mb-0 align-middle">
        <thead>
          <tr>
            <th>Job Details</th>
            <th>Action Type</th>
            <th>Schedule Pattern</th>
            <th>Next Execution</th>
            <th>Status</th>
            <th>Last Run Result</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const lastLog = job.logs && job.logs[0];
            const humanSchedule = cronToHumanReadable(job.cronExpression);

            return (
              <tr key={job.id}>
                <td>
                  <div className="fw-semibold text-dark fs-6 mb-0.5">{job.name}</div>
                  <div className="text-muted font-monospace small" style={{ fontSize: '0.75rem' }}>
                    ID: {job.id.slice(0, 8)}...
                  </div>
                </td>
                <td>
                  {getJobTypeBadge(job.jobType)}
                </td>
                <td>
                  <div className="d-flex flex-column align-items-start gap-1">
                    <span className="fw-medium text-dark d-flex align-items-center gap-1.5 small">
                      <Clock size={13} className="text-muted" />
                      {humanSchedule}
                    </span>
                    <span className="cron-code" title="Underlying Cron Expression">
                      {job.cronExpression}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-1">
                    {formatDate(job.nextRunAt)}
                  </div>
                </td>
                <td>
                  <StatusBadge status={job.status} />
                </td>
                <td>
                  {job.lastRunAt ? (
                    <div>
                      <div>{formatDate(job.lastRunAt)}</div>
                      {lastLog && (
                        <div className="mt-1 d-flex align-items-center gap-1.5">
                          <StatusBadge status={lastLog.status} />
                          {lastLog.executionTimeMs !== null && (
                            <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '0.7rem' }}>
                              {lastLog.executionTimeMs}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted small fst-italic">Pending first run</span>
                  )}
                </td>
                <td className="text-end">
                  <div className="d-flex align-items-center justify-content-end gap-1.5">
                    <Button
                      variant="primary"
                      size="sm"
                      title="Run immediately"
                      onClick={() => onTrigger(job.id)}
                      className="d-flex align-items-center gap-1 py-1 px-2.5 small"
                    >
                      <Play size={13} /> Run
                    </Button>

                    {job.status === 'ACTIVE' ? (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        title="Pause Schedule"
                        onClick={() => onPause(job.id)}
                        className="py-1 px-2"
                      >
                        <Pause size={13} />
                      </Button>
                    ) : (
                      <Button
                        variant="outline-success"
                        size="sm"
                        title="Resume Schedule"
                        onClick={() => onResume(job.id)}
                        className="py-1 px-2"
                      >
                        <RefreshCw size={13} />
                      </Button>
                    )}

                    <Dropdown align="end">
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        size="sm"
                        className="py-1 px-2 border-0"
                        id={`dropdown-${job.id}`}
                      >
                        <MoreVertical size={15} />
                      </Dropdown.Toggle>

                      <Dropdown.Menu className="shadow-sm border">
                        <Dropdown.Item onClick={() => onViewLogs(job.id)} className="d-flex align-items-center gap-2 small py-1.5">
                          <FileText size={14} className="text-muted" /> Execution Logs
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onEdit(job)} className="d-flex align-items-center gap-2 small py-1.5">
                          <Edit2 size={14} className="text-muted" /> Edit Configuration
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => onDelete(job.id)} className="text-danger d-flex align-items-center gap-2 small py-1.5">
                          <Trash2 size={14} /> Delete Schedule
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
