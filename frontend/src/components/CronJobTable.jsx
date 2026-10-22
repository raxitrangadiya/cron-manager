import React, { useState, useMemo } from 'react';
import { Table, Button, Dropdown, Badge, Form, Pagination } from 'react-bootstrap';
import {
  Play,
  Pause,
  RefreshCw,
  MoreVertical,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Zap,
  CheckSquare,
  Square
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cronToHumanReadable } from '../utils/cronHumanizer';
import { formatRelativeTime, formatDateTime } from '../utils/timeFormatter';

export const CronJobTable = ({
  jobs = [],
  onEdit,
  onPause,
  onResume,
  onTrigger,
  onDelete,
  onViewLogs,
  onCreateNew
}) => {
  // Sorting state
  const [sortField, setSortField] = useState('nextRunAt'); // 'name', 'jobType', 'nextRunAt', 'status', 'lastRunAt'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sorted jobs
  const sortedJobs = useMemo(() => {
    const list = [...jobs];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'nextRunAt' || sortField === 'lastRunAt') {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return 0;
    });
    return list;
  }, [jobs, sortField, sortOrder]);

  // Paginated jobs
  const totalPages = Math.ceil(sortedJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedJobs.map((j) => j.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Copy ID helper
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Bulk actions
  const handleBulkTrigger = () => {
    selectedIds.forEach((id) => onTrigger(id));
    setSelectedIds([]);
  };

  const handleBulkPause = () => {
    selectedIds.forEach((id) => onPause(id));
    setSelectedIds([]);
  };

  const handleBulkResume = () => {
    selectedIds.forEach((id) => onResume(id));
    setSelectedIds([]);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-muted ms-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} className="text-primary ms-1" />
    ) : (
      <ArrowDown size={13} className="text-primary ms-1" />
    );
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-5 rounded-3 bg-white border custom-table-container">
        <div className="p-3 bg-light rounded-circle d-inline-flex text-muted mb-3">
          <Calendar size={32} />
        </div>
        <h6 className="fw-bold text-dark">No scheduled jobs match your criteria</h6>
        <p className="text-muted small mb-3">
          Create a new scheduled task or choose a ready-to-run template from the Pattern Master.
        </p>
        {onCreateNew && (
          <Button variant="primary" size="sm" onClick={onCreateNew}>
            + Schedule New Job
          </Button>
        )}
      </div>
    );
  }

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
    <div className="custom-table-container">
      {/* Bulk Action Bar (When items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-2.5 bg-primary bg-opacity-10 border-bottom d-flex align-items-center justify-content-between px-3">
          <div className="small fw-semibold text-primary d-flex align-items-center gap-2">
            <CheckSquare size={16} />
            <span>{selectedIds.length} jobs selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button variant="primary" size="sm" className="py-1 px-2.5 small d-flex align-items-center gap-1" onClick={handleBulkTrigger}>
              <Zap size={13} /> Trigger Selected
            </Button>
            <Button variant="outline-warning" size="sm" className="py-1 px-2.5 small d-flex align-items-center gap-1" onClick={handleBulkPause}>
              <Pause size={13} /> Pause Selected
            </Button>
            <Button variant="outline-success" size="sm" className="py-1 px-2.5 small d-flex align-items-center gap-1" onClick={handleBulkResume}>
              <RefreshCw size={13} /> Resume Selected
            </Button>
            <Button variant="light" size="sm" className="py-1 px-2 small border" onClick={() => setSelectedIds([])}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="table-responsive">
        <Table hover className="custom-table mb-0 align-middle">
          <thead>
            <tr>
              <th style={{ width: '40px' }} className="text-center">
                <Form.Check
                  type="checkbox"
                  checked={paginatedJobs.length > 0 && selectedIds.length === paginatedJobs.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th role="button" onClick={() => handleSort('name')} className="user-select-none">
                <div className="d-flex align-items-center">
                  <span>Job Name</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th role="button" onClick={() => handleSort('jobType')} className="user-select-none">
                <div className="d-flex align-items-center">
                  <span>Action Type</span>
                  {renderSortIcon('jobType')}
                </div>
              </th>
              <th>Schedule Pattern</th>
              <th role="button" onClick={() => handleSort('nextRunAt')} className="user-select-none">
                <div className="d-flex align-items-center">
                  <span>Next Execution</span>
                  {renderSortIcon('nextRunAt')}
                </div>
              </th>
              <th role="button" onClick={() => handleSort('status')} className="user-select-none">
                <div className="d-flex align-items-center">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th role="button" onClick={() => handleSort('lastRunAt')} className="user-select-none">
                <div className="d-flex align-items-center">
                  <span>Last Run</span>
                  {renderSortIcon('lastRunAt')}
                </div>
              </th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobs.map((job) => {
              const lastLog = job.logs && job.logs[0];
              const humanSchedule = cronToHumanReadable(job.cronExpression);
              const isSelected = selectedIds.includes(job.id);

              return (
                <tr key={job.id} className={isSelected ? 'bg-primary bg-opacity-10' : ''}>
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(job.id)}
                    />
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="fw-semibold text-dark fs-6">{job.name}</span>
                    </div>
                    <div className="d-flex align-items-center gap-1 text-muted small" style={{ fontSize: '0.75rem' }}>
                      <span className="font-monospace">ID: {job.id.slice(0, 8)}...</span>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-muted"
                        title="Copy Full UUID"
                        onClick={() => handleCopyId(job.id)}
                      >
                        {copiedId === job.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
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
                    {job.nextRunAt ? (
                      <div className="d-flex flex-column align-items-start">
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5 rounded-pill small fw-medium mb-1">
                          {formatRelativeTime(job.nextRunAt)}
                        </span>
                        <span className="text-secondary small" style={{ fontSize: '0.78rem' }}>
                          {formatDateTime(job.nextRunAt)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>
                    {job.lastRunAt ? (
                      <div>
                        <div className="small text-secondary">{formatRelativeTime(job.lastRunAt)}</div>
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
                        title="Run now immediately"
                        onClick={() => onTrigger(job.id)}
                        className="d-flex align-items-center gap-1 py-1 px-2.5 small"
                      >
                        <Play size={13} /> Run
                      </Button>

                      {job.status === 'ACTIVE' ? (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          title="Pause schedule"
                          onClick={() => onPause(job.id)}
                          className="py-1 px-2"
                        >
                          <Pause size={13} />
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          title="Resume schedule"
                          onClick={() => onResume(job.id)}
                          className="py-1 px-2"
                        >
                          <RefreshCw size={13} />
                        </Button>
                      )}

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        title="View Execution Logs"
                        onClick={() => onViewLogs(job.id)}
                        className="py-1 px-2"
                      >
                        <FileText size={14} />
                      </Button>

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
                          <Dropdown.Item onClick={() => onEdit(job)} className="d-flex align-items-center gap-2 small py-1.5">
                            <Edit2 size={14} className="text-muted" /> Edit Configuration
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleCopyId(job.id)} className="d-flex align-items-center gap-2 small py-1.5">
                            <Copy size={14} className="text-muted" /> Copy Job ID
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

      {/* Pagination Footer */}
      <div className="p-3 border-top d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 bg-white">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedJobs.length)} of {sortedJobs.length} jobs
          </span>
          <Form.Select
            size="sm"
            style={{ width: '80px' }}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </Form.Select>
          <span className="text-muted small">per page</span>
        </div>

        {totalPages > 1 && (
          <Pagination size="sm" className="mb-0">
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Pagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            />
          </Pagination>
        )}
      </div>
    </div>
  );
};
