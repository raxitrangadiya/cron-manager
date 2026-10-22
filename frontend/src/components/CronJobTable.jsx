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
  CheckSquare
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
  const [sortField, setSortField] = useState('nextRunAt');
  const [sortOrder, setSortOrder] = useState('asc');

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
    setTimeout(() => setCopiedId(null), 1800);
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
      return <ArrowUpDown size={11} className="text-muted ms-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={11} className="text-primary ms-1" />
    ) : (
      <ArrowDown size={11} className="text-primary ms-1" />
    );
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-4 bg-white border rounded custom-table-container">
        <div className="p-2 bg-light rounded-circle d-inline-flex text-muted mb-2">
          <Calendar size={24} />
        </div>
        <h6 className="fw-bold text-dark fs-6 mb-1">No scheduled jobs found</h6>
        <p className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>
          Get started by scheduling your first automated task.
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
        return <Badge bg="primary" bg-opacity="10" className="text-primary border border-primary border-opacity-25 fw-medium" style={{ fontSize: '0.72rem' }}>Sales Report</Badge>;
      case 'EMAIL_NOTIFICATION':
        return <Badge bg="info" bg-opacity="10" className="text-info border border-info border-opacity-25 fw-medium" style={{ fontSize: '0.72rem' }}>Email Dispatch</Badge>;
      case 'ENCRYPTION_ROTATION':
        return <Badge bg="warning" bg-opacity="10" className="text-warning border border-warning border-opacity-25 fw-medium" style={{ fontSize: '0.72rem' }}>Key Rotation</Badge>;
      case 'LOG_CLEANUP':
        return <Badge bg="secondary" bg-opacity="10" className="text-secondary border border-secondary border-opacity-25 fw-medium" style={{ fontSize: '0.72rem' }}>Log Purge</Badge>;
      default:
        return <Badge bg="light" text="dark" className="border fw-medium" style={{ fontSize: '0.72rem' }}>{jobType}</Badge>;
    }
  };

  return (
    <div className="custom-table-container">
      {/* Bulk Action Bar (When items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-2 bg-primary bg-opacity-10 border-bottom d-flex align-items-center justify-content-between px-3">
          <div className="small fw-semibold text-primary d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
            <CheckSquare size={14} />
            <span>{selectedIds.length} jobs selected</span>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <Button variant="primary" size="sm" className="py-0.5 px-2 small d-flex align-items-center gap-1" onClick={handleBulkTrigger}>
              <Zap size={11} /> Trigger Selected
            </Button>
            <Button variant="outline-warning" size="sm" className="py-0.5 px-2 small d-flex align-items-center gap-1" onClick={handleBulkPause}>
              <Pause size={11} /> Pause
            </Button>
            <Button variant="outline-success" size="sm" className="py-0.5 px-2 small d-flex align-items-center gap-1" onClick={handleBulkResume}>
              <RefreshCw size={11} /> Resume
            </Button>
            <Button variant="light" size="sm" className="py-0.5 px-2 small border" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Main Table with Optimized Column Widths */}
      <div className="table-responsive">
        <Table hover className="custom-table mb-0 align-middle">
          <thead>
            <tr>
              <th style={{ width: '36px' }} className="text-center">
                <Form.Check
                  type="checkbox"
                  checked={paginatedJobs.length > 0 && selectedIds.length === paginatedJobs.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th role="button" onClick={() => handleSort('name')} className="user-select-none" style={{ minWidth: '180px' }}>
                <div className="d-flex align-items-center">
                  <span>Job Name</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th role="button" onClick={() => handleSort('jobType')} className="user-select-none" style={{ width: '120px' }}>
                <div className="d-flex align-items-center">
                  <span>Action</span>
                  {renderSortIcon('jobType')}
                </div>
              </th>
              <th style={{ minWidth: '200px' }}>Recurrence Schedule</th>
              <th role="button" onClick={() => handleSort('nextRunAt')} className="user-select-none" style={{ minWidth: '150px' }}>
                <div className="d-flex align-items-center">
                  <span>Next Execution</span>
                  {renderSortIcon('nextRunAt')}
                </div>
              </th>
              <th role="button" onClick={() => handleSort('status')} className="user-select-none" style={{ width: '90px' }}>
                <div className="d-flex align-items-center">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th role="button" onClick={() => handleSort('lastRunAt')} className="user-select-none" style={{ minWidth: '140px' }}>
                <div className="d-flex align-items-center">
                  <span>Last Run</span>
                  {renderSortIcon('lastRunAt')}
                </div>
              </th>
              <th className="text-end" style={{ width: '130px' }}>Actions</th>
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
                    <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }} title={job.name}>
                      {job.name}
                    </div>
                    <div className="d-flex align-items-center gap-1 text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                      <span>{job.id.slice(0, 8)}</span>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-muted"
                        title="Copy Job ID"
                        onClick={() => handleCopyId(job.id)}
                      >
                        {copiedId === job.id ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    {getJobTypeBadge(job.jobType)}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                      <span className="fw-medium text-dark d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                        <Clock size={12} className="text-muted" />
                        {humanSchedule}
                      </span>
                      <code className="cron-code" title="Standard Cron Format">
                        {job.cronExpression}
                      </code>
                    </div>
                  </td>
                  <td>
                    {job.nextRunAt ? (
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-1.5 py-0.5 rounded-pill" style={{ fontSize: '0.72rem' }}>
                          {formatRelativeTime(job.nextRunAt)}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.74rem' }} title={new Date(job.nextRunAt).toISOString()}>
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
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          {formatRelativeTime(job.lastRunAt)}
                        </span>
                        {lastLog && (
                          <span
                            className={`badge ${lastLog.status === 'SUCCESS' ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${lastLog.status === 'SUCCESS' ? 'success' : 'danger'} border font-monospace`}
                            style={{ fontSize: '0.68rem', padding: '0.15rem 0.35rem' }}
                            title={`Execution: ${lastLog.status}`}
                          >
                            {lastLog.executionTimeMs !== null ? `${lastLog.executionTimeMs}ms` : lastLog.status}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted fst-italic" style={{ fontSize: '0.72rem' }}>Never run</span>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1">
                      <Button
                        variant="primary"
                        size="sm"
                        title="Trigger execution now"
                        onClick={() => onTrigger(job.id)}
                        className="py-0.5 px-2 d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <Play size={11} /> Run
                      </Button>

                      {job.status === 'ACTIVE' ? (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          title="Pause"
                          onClick={() => onPause(job.id)}
                          className="py-0.5 px-1.5"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <Pause size={11} />
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          title="Resume"
                          onClick={() => onResume(job.id)}
                          className="py-0.5 px-1.5"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <RefreshCw size={11} />
                        </Button>
                      )}

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        title="Logs"
                        onClick={() => onViewLogs(job.id)}
                        className="py-0.5 px-1.5"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <FileText size={12} />
                      </Button>

                      <Dropdown align="end">
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          className="py-0.5 px-1 border-0"
                          id={`dropdown-${job.id}`}
                        >
                          <MoreVertical size={13} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="shadow-sm border py-1" style={{ fontSize: '0.8rem' }}>
                          <Dropdown.Item onClick={() => onEdit(job)} className="d-flex align-items-center gap-2 py-1">
                            <Edit2 size={13} className="text-muted" /> Edit Configuration
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleCopyId(job.id)} className="d-flex align-items-center gap-2 py-1">
                            <Copy size={13} className="text-muted" /> Copy Full ID
                          </Dropdown.Item>
                          <Dropdown.Divider className="my-1" />
                          <Dropdown.Item onClick={() => onDelete(job.id)} className="text-danger d-flex align-items-center gap-2 py-1">
                            <Trash2 size={13} /> Delete Job
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

      {/* Compact Pagination Bar */}
      <div className="p-2 border-top d-flex flex-column flex-sm-row align-items-center justify-content-between gap-1.5 bg-white">
        <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.75rem' }}>
          <span>
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedJobs.length)} of {sortedJobs.length} jobs
          </span>
          <span className="text-secondary">•</span>
          <Form.Select
            size="sm"
            style={{ width: '65px', fontSize: '0.72rem', padding: '0.15rem 0.4rem' }}
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
          <span>per page</span>
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
