import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Nav, Form, InputGroup, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  RefreshCw,
  Calendar,
  CheckCircle2,
  PauseCircle,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  Activity,
  Zap
} from 'lucide-react';

import {
  getMetrics,
  getJobs,
  getJobTypes,
  getSchedulePatterns,
  createSchedulePattern,
  deleteSchedulePattern,
  createJob,
  updateJob,
  pauseJob,
  resumeJob,
  triggerJobNow,
  deleteJob,
  getJobLogs
} from '../api/scheduler.api';

import { CronJobTable } from '../components/CronJobTable';
import { CronJobModal } from '../components/CronJobModal';
import { CronJobLogModal } from '../components/CronJobLogModal';
import { PatternMasterList } from '../components/PatternMasterList';
import { PatternMasterModal } from '../components/PatternMasterModal';

export const SchedulerDashboard = () => {
  const queryClient = useQueryClient();

  const [activeMainTab, setActiveMainTab] = useState('jobs'); // 'jobs' or 'patterns'

  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [preselectedPattern, setPreselectedPattern] = useState(null);

  const [showPatternModal, setShowPatternModal] = useState(false);

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobName, setSelectedJobName] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'PAUSED'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' or specific jobType

  // Toast Notification System
  const [toast, setToast] = useState({ show: false, title: '', message: '', variant: 'success' });

  const showToast = (message, title = 'Notification', variant = 'success') => {
    setToast({ show: true, title, message, variant });
  };

  // Queries
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    refetchInterval: 5000
  });

  const { data: jobs, isLoading: isJobsLoading, refetch: refetchJobs, isRefetching } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
    refetchInterval: 5000
  });

  const { data: jobTypes = [] } = useQuery({
    queryKey: ['jobTypes'],
    queryFn: getJobTypes
  });

  const { data: schedulePatterns = [] } = useQuery({
    queryKey: ['schedulePatterns'],
    queryFn: getSchedulePatterns
  });

  const { data: jobLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['jobLogs', selectedJobId],
    queryFn: () => getJobLogs(selectedJobId),
    enabled: Boolean(selectedJobId),
    refetchInterval: 3000
  });

  // Client-side filtering of jobs
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      if (statusFilter !== 'ALL' && job.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && job.jobType !== typeFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = job.name?.toLowerCase().includes(term);
        const matchesId = job.id?.toLowerCase().includes(term);
        const matchesType = job.jobType?.toLowerCase().includes(term);
        const matchesCron = job.cronExpression?.toLowerCase().includes(term);
        return matchesName || matchesId || matchesType || matchesCron;
      }
      return true;
    });
  }, [jobs, searchTerm, statusFilter, typeFilter]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      setShowModal(false);
      setPreselectedPattern(null);
      showToast(`Scheduled Job "${data.name}" created!`, 'Success', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Creating Job', 'danger');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      setShowModal(false);
      setEditingJob(null);
      setPreselectedPattern(null);
      showToast(`Job "${data.name}" updated.`, 'Updated', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Updating Job', 'danger');
    }
  });

  const pauseMutation = useMutation({
    mutationFn: pauseJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      showToast('Scheduled task paused.', 'Paused', 'warning');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Pausing Job', 'danger');
    }
  });

  const resumeMutation = useMutation({
    mutationFn: resumeJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      showToast('Task resumed schedule.', 'Active', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Resuming Job', 'danger');
    }
  });

  const triggerMutation = useMutation({
    mutationFn: triggerJobNow,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      showToast(res.message || 'Job queued for immediate run!', 'Triggered', 'info');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Trigger Failed', 'danger');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      showToast('Job schedule deleted.', 'Deleted', 'warning');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Deleting', 'danger');
    }
  });

  const createPatternMutation = useMutation({
    mutationFn: createSchedulePattern,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedulePatterns']);
      setShowPatternModal(false);
      showToast(`Pattern Master "${data.name}" saved!`, 'Saved', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Saving Pattern', 'danger');
    }
  });

  const deletePatternMutation = useMutation({
    mutationFn: deleteSchedulePattern,
    onSuccess: () => {
      queryClient.invalidateQueries(['schedulePatterns']);
      showToast('Pattern template deleted.', 'Deleted', 'warning');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Deleting', 'danger');
    }
  });

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setPreselectedPattern(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setPreselectedPattern(null);
    setShowModal(true);
  };

  const handleApplyPatternToJob = (pattern) => {
    setEditingJob(null);
    setPreselectedPattern(pattern);
    setActiveMainTab('jobs');
    setShowModal(true);
  };

  const handleFormSubmit = (jobData) => {
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, jobData });
    } else {
      createMutation.mutate(jobData);
    }
  };

  const handleViewLogs = (jobId) => {
    const job = jobs?.find((j) => j.id === jobId);
    setSelectedJobId(jobId);
    setSelectedJobName(job ? job.name : '');
    setShowLogModal(true);
  };

  return (
    <div>
      {/* Toast Notification Container */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          delay={3500}
          autohide
          bg="white"
          className="border shadow-sm"
        >
          <Toast.Header className="py-1 px-2.5">
            <div className={`p-1 rounded-circle bg-${toast.variant} me-2`} style={{ width: '7px', height: '7px' }}></div>
            <strong className="me-auto text-dark small">{toast.title}</strong>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Just now</small>
          </Toast.Header>
          <Toast.Body className="py-2 px-2.5 small text-secondary">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Top Bar: Title & Actions */}
      <div className="d-flex align-items-center justify-content-between mb-2.5">
        <div>
          <h5 className="fw-bold text-dark mb-0 fs-6">Scheduled Task Engine</h5>
          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
            Windows Task Scheduler-style recurrence manager with BullMQ & Redis execution.
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-flex align-items-center gap-1.5 py-1 px-2.5"
            onClick={() => refetchJobs()}
            disabled={isRefetching}
            title="Refresh Schedules"
          >
            <RefreshCw size={13} className={isRefetching ? 'spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1.5 py-1 px-3 fw-medium"
            onClick={handleOpenCreateModal}
          >
            <Plus size={14} />
            <span>Schedule New Job</span>
          </Button>
        </div>
      </div>

      {/* Compact Metrics Row (High Density, Low Whitespace) */}
      <Row className="g-2 mb-2.5">
        <Col xs={6} md={3}>
          <div className="metric-card-compact">
            <div>
              <div className="metric-title">Total Schedules</div>
              <div className="metric-val">{isMetricsLoading ? '—' : metrics?.totalJobs || 0}</div>
            </div>
            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
              <Calendar size={15} />
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="metric-card-compact">
            <div>
              <div className="metric-title">Active Running</div>
              <div className="metric-val text-success">{isMetricsLoading ? '—' : metrics?.activeJobs || 0}</div>
            </div>
            <div className="p-2 bg-success bg-opacity-10 text-success rounded-circle">
              <CheckCircle2 size={15} />
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="metric-card-compact">
            <div>
              <div className="metric-title">Paused</div>
              <div className="metric-val text-warning">{isMetricsLoading ? '—' : metrics?.pausedJobs || 0}</div>
            </div>
            <div className="p-2 bg-warning bg-opacity-10 text-warning rounded-circle">
              <PauseCircle size={15} />
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="metric-card-compact">
            <div>
              <div className="metric-title">Total Executions</div>
              <div className="metric-val text-primary">{isMetricsLoading ? '—' : metrics?.totalLogs || 0}</div>
            </div>
            <div className="p-2 bg-info bg-opacity-10 text-info rounded-circle">
              <Activity size={15} />
            </div>
          </div>
        </Col>
      </Row>

      {/* Tabs & Search Filter Toolbar (All in one unified row) */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-2.5 p-2 bg-white rounded border">
        <Nav variant="pills" activeKey={activeMainTab} onSelect={(k) => setActiveMainTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="jobs" className="d-flex align-items-center gap-1.5 py-1 px-2.5">
              <Calendar size={13} />
              <span>Scheduled Jobs</span>
              <span className="badge bg-light text-dark border ms-1" style={{ fontSize: '0.68rem' }}>
                {jobs?.length || 0}
              </span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="patterns" className="d-flex align-items-center gap-1.5 py-1 px-2.5">
              <Layers size={13} />
              <span>Pattern Master</span>
              <span className="badge bg-light text-dark border ms-1" style={{ fontSize: '0.68rem' }}>
                {schedulePatterns?.length || 0}
              </span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeMainTab === 'jobs' && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div style={{ width: '200px' }}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-white border-end-0 text-muted py-0 px-2">
                  <Search size={13} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Filter by name, type..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>

            <Form.Select
              size="sm"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </Form.Select>

            <Form.Select
              size="sm"
              style={{ width: 'auto' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Tasks</option>
              {jobTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </Form.Select>
          </div>
        )}

        {activeMainTab === 'patterns' && (
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1 py-1 px-2.5 ms-auto"
            onClick={() => setShowPatternModal(true)}
          >
            <Plus size={13} />
            <span>Create Master</span>
          </Button>
        )}
      </div>

      {activeMainTab === 'jobs' ? (
        <>
          {isJobsLoading ? (
            <div className="text-center py-4 bg-white border rounded">
              <Spinner animation="border" size="sm" variant="primary" />
              <span className="text-muted small ms-2">Loading schedules...</span>
            </div>
          ) : (
            <CronJobTable
              jobs={filteredJobs}
              onEdit={handleOpenEditModal}
              onPause={(id) => pauseMutation.mutate(id)}
              onResume={(id) => resumeMutation.mutate(id)}
              onTrigger={(id) => triggerMutation.mutate(id)}
              onDelete={(id) => {
                if (window.confirm('Delete this scheduled job?')) {
                  deleteMutation.mutate(id);
                }
              }}
              onViewLogs={handleViewLogs}
              onCreateNew={handleOpenCreateModal}
            />
          )}
        </>
      ) : (
        <PatternMasterList
          patterns={schedulePatterns}
          onDelete={(id) => {
            if (window.confirm('Delete this pattern template?')) {
              deletePatternMutation.mutate(id);
            }
          }}
          onApplyPattern={handleApplyPatternToJob}
          onCreateNew={() => setShowPatternModal(true)}
        />
      )}

      {/* Create / Edit Job Modal */}
      <CronJobModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingJob(null);
          setPreselectedPattern(null);
        }}
        onSubmit={handleFormSubmit}
        jobTypes={jobTypes}
        schedulePatterns={schedulePatterns}
        initialValues={editingJob}
        preselectedPattern={preselectedPattern}
      />

      {/* Create Pattern Master Modal */}
      <PatternMasterModal
        show={showPatternModal}
        onHide={() => setShowPatternModal(false)}
        onSubmit={(patternData) => createPatternMutation.mutate(patternData)}
      />

      {/* Logs History Modal */}
      <CronJobLogModal
        show={showLogModal}
        onHide={() => {
          setShowLogModal(false);
          setSelectedJobId(null);
        }}
        logs={jobLogs}
        isLoading={isLogsLoading}
        jobName={selectedJobName}
      />
    </div>
  );
};
