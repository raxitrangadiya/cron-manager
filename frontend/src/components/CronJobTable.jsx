import React from 'react';
import { Table, Button, Dropdown } from 'react-bootstrap';
import { Play, Pause, RefreshCw, MoreVertical, Edit2, Trash2, FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

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
      <div className="text-center py-5 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25">
        <p className="text-muted mb-0">No scheduled jobs configured yet. Click "Create New Job" to get started.</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return <span className="text-muted small">—</span>;
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="table-responsive rounded-3">
      <Table hover className="custom-table mb-0 align-middle">
        <thead>
          <tr>
            <th>Job Name</th>
            <th>Type</th>
            <th>Cron Schedule</th>
            <th>Timezone</th>
            <th>Next Execution</th>
            <th>Status</th>
            <th>Last Execution</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const lastLog = job.logs && job.logs[0];
            return (
              <tr key={job.id}>
                <td>
                  <div className="fw-semibold text-white">{job.name}</div>
                  <div className="text-muted small">ID: {job.id.slice(0, 8)}...</div>
                </td>
                <td>
                  <span className="badge bg-secondary bg-opacity-20 text-light border border-secondary border-opacity-30">
                    {job.jobType}
                  </span>
                </td>
                <td>
                  <span className="cron-code">{job.cronExpression}</span>
                </td>
                <td className="text-muted small">{job.timezone}</td>
                <td className="small text-info">{formatDate(job.nextRunAt)}</td>
                <td>
                  <StatusBadge status={job.status} />
                </td>
                <td>
                  {job.lastRunAt ? (
                    <div>
                      <div className="small">{formatDate(job.lastRunAt)}</div>
                      {lastLog && (
                        <span className="small text-muted me-1">
                          (<StatusBadge status={lastLog.status} />)
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
                      variant="outline-primary"
                      size="sm"
                      title="Trigger Immediate Run"
                      onClick={() => onTrigger(job.id)}
                      className="d-flex align-items-center gap-1 py-1 px-2 border-opacity-50"
                    >
                      <Play size={14} /> Run
                    </Button>

                    {job.status === 'ACTIVE' ? (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        title="Pause Job"
                        onClick={() => onPause(job.id)}
                        className="py-1 px-2 border-opacity-50"
                      >
                        <Pause size={14} />
                      </Button>
                    ) : (
                      <Button
                        variant="outline-success"
                        size="sm"
                        title="Resume Job"
                        onClick={() => onResume(job.id)}
                        className="py-1 px-2 border-opacity-50"
                      >
                        <RefreshCw size={14} />
                      </Button>
                    )}

                    <Dropdown align="end">
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        size="sm"
                        className="py-1 px-2 border-opacity-50 border-0"
                        id={`dropdown-${job.id}`}
                      >
                        <MoreVertical size={16} />
                      </Dropdown.Toggle>

                      <Dropdown.Menu className="dropdown-menu-dark">
                        <Dropdown.Item onClick={() => onViewLogs(job.id)} className="d-flex align-items-center gap-2">
                          <FileText size={14} /> View Execution Logs
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onEdit(job)} className="d-flex align-items-center gap-2">
                          <Edit2 size={14} /> Edit Configuration
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
