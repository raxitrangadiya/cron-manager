import React from 'react';
import { Table, Button, Dropdown, Badge } from 'react-bootstrap';
import { Play, Pause, RefreshCw, MoreVertical, Edit2, Trash2, FileText, Calendar } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cronToHumanReadable } from '../utils/cronHumanizer';

export const CronJobTable = ({
  jobs,
  onEdit,
  onPause,
  onResume,
  onTrigger,
  onDelete,
  onViewLogs
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-5 rounded-3 bg-light border">
        <p className="text-muted mb-0">No scheduled jobs configured yet. Click "Create New Job" to get started.</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return <span className="text-muted small">—</span>;
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="table-responsive rounded-3 border bg-white shadow-sm">
      <Table hover className="mb-0 align-middle">
        <thead className="bg-light">
          <tr>
            <th className="py-3">Job Name</th>
            <th className="py-3">Action Type</th>
            <th className="py-3">Schedule</th>
            <th className="py-3">Next Execution</th>
            <th className="py-3">Status</th>
            <th className="py-3">Last Run</th>
            <th className="py-3 text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const lastLog = job.logs && job.logs[0];
            const humanSchedule = cronToHumanReadable(job.cronExpression);

            return (
              <tr key={job.id}>
                <td>
                  <div className="fw-bold text-dark">{job.name}</div>
                  <div className="text-muted small">ID: {job.id.slice(0, 8)}</div>
                </td>
                <td>
                  <Badge bg="secondary" className="fw-normal">
                    {job.jobType}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold text-dark d-flex align-items-center gap-1">
                      <Calendar size={14} className="text-muted" />
                      {humanSchedule}
                    </span>
                    <Badge bg="light" text="dark" className="border font-monospace fw-normal">
                      {job.cronExpression}
                    </Badge>
                  </div>
                </td>
                <td className="small text-primary font-semibold">{formatDate(job.nextRunAt)}</td>
                <td>
                  <StatusBadge status={job.status} />
                </td>
                <td>
                  {job.lastRunAt ? (
                    <div>
                      <div className="small text-dark">{formatDate(job.lastRunAt)}</div>
                      {lastLog && (
                        <span className="small text-muted">
                          Result: <StatusBadge status={lastLog.status} />
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted small">Never run</span>
                  )}
                </td>
                <td className="text-end">
                  <div className="d-flex align-items-center justify-content-end gap-1">
                    <Button
                      variant="primary"
                      size="sm"
                      title="Trigger Immediate Run"
                      onClick={() => onTrigger(job.id)}
                      className="d-flex align-items-center gap-1 py-1 px-2"
                    >
                      <Play size={14} /> Run Now
                    </Button>

                    {job.status === 'ACTIVE' ? (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        title="Pause Job"
                        onClick={() => onPause(job.id)}
                        className="py-1 px-2"
                      >
                        <Pause size={14} />
                      </Button>
                    ) : (
                      <Button
                        variant="outline-success"
                        size="sm"
                        title="Resume Job"
                        onClick={() => onResume(job.id)}
                        className="py-1 px-2"
                      >
                        <RefreshCw size={14} />
                      </Button>
                    )}

                    <Dropdown align="end">
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        size="sm"
                        className="py-1 px-2 border-0"
                        id={`dropdown-${job.id}`}
                      >
                        <MoreVertical size={16} />
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => onViewLogs(job.id)} className="d-flex align-items-center gap-2">
                          <FileText size={14} /> View Execution Logs
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onEdit(job)} className="d-flex align-items-center gap-2">
                          <Edit2 size={14} /> Edit Job
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => onDelete(job.id)} className="text-danger d-flex align-items-center gap-2">
                          <Trash2 size={14} /> Delete Job
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
