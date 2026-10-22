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
  Zap,
  CheckCheck
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
      // Status filter
      if (statusFilter !== 'ALL' && job.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL' && job.jobType !== typeFilter) {
        return false;
      }
      // Search filter
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
      showToast(`Scheduled Job "${data.name}" registered and running!`, 'Success', 'success');
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
      showToast(`Job "${data.name}" updated successfully.`, 'Updated', 'success');
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
      showToast('Scheduled task resumed active state.', 'Active', 'success');
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
      showToast(res.message || 'Job queued for immediate execution!', 'Triggered', 'info');
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
      showToast('Job schedule deleted from system.', 'Deleted', 'warning');
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
      showToast(`Schedule Pattern Master "${data.name}" created!`, 'Pattern Saved', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Saving Pattern', 'danger');
    }
  });

  const deletePatternMutation = useMutation({
    mutationFn: deleteSchedulePattern,
    onSuccess: () => {
      queryClient.invalidateQueries(['schedulePatterns']);
      showToast('Schedule pattern template deleted.', 'Deleted', 'warning');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message, 'Error Deleting Pattern', 'danger');
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
          delay={4000}
          autohide
          bg="white"
          className="border shadow-sm"
        >
          <Toast.Header>
            <div className={`p-1 rounded-circle bg-${toast.variant} me-2`} style={{ width: '8px', height: '8px' }}></div>
            <strong className="me-auto text-dark small">{toast.title}</strong>
            <small className="text-muted">Just now</small>
          </Toast.Header>
          <Toast.Body className="small text-secondary">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Dynamic Task Scheduler</h4>
          <p className="text-muted small mb-0">
            Automate recurring workloads, configure Windows Task Scheduler-style recurrence, and monitor execution health.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-flex align-items-center gap-1.5 py-1.5 px-3"
            onClick={() => refetchJobs()}
            disabled={isRefetching}
          >
            <RefreshCw size={14} className={isRefetching ? 'spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1.5 py-1.5 px-3 fw-medium"
            onClick={handleOpenCreateModal}
          >
            <Plus size={15} />
            <span>Schedule New Job</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase tracking-wider">Total Schedules</span>
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
                <Calendar size={18} />
              </div>
            </div>
            <div className="metric-value">
              {isMetricsLoading ? '—' : metrics?.totalJobs || 0}
            </div>
            <div className="text-muted small mt-1">Configured in registry</div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase tracking-wider">Active Jobs</span>
              <div className="p-2 bg-success bg-opacity-10 text-success rounded-circle">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="metric-value text-success">
              {isMetricsLoading ? '—' : metrics?.activeJobs || 0}
            </div>
            <div className="text-muted small mt-1">Currently running on schedule</div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase tracking-wider">Paused</span>
              <div className="p-2 bg-warning bg-opacity-10 text-warning rounded-circle">
                <PauseCircle size={18} />
              </div>
            </div>
            <div className="metric-value text-warning">
              {isMetricsLoading ? '—' : metrics?.pausedJobs || 0}
            </div>
            <div className="text-muted small mt-1">Temporarily suspended</div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase tracking-wider">Total Executions</span>
              <div className="p-2 bg-info bg-opacity-10 text-info rounded-circle">
                <Activity size={18} />
              </div>
            </div>
            <div className="metric-value text-primary">
              {isMetricsLoading ? '—' : metrics?.totalLogs || 0}
            </div>
            <div className="text-muted small mt-1">
              <span className="text-success fw-medium">{metrics?.successLogs || 0} successful</span>
              {metrics?.failedLogs > 0 && <span className="text-danger ms-1">({metrics.failedLogs} failed)</span>}
            </div>
          </div>
        </Col>
      </Row>

      {/* Navigation Tabs & Search Toolbar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
        <Nav variant="pills" activeKey={activeMainTab} onSelect={(k) => setActiveMainTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="jobs" className="d-flex align-items-center gap-2">
              <Calendar size={15} />
              <span>Scheduled Jobs</span>
              <Badge bg="light" text="dark" className="border ms-1 small">
                {jobs?.length || 0}
              </Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="patterns" className="d-flex align-items-center gap-2">
              <Layers size={15} />
              <span>Schedule Pattern Master</span>
              <Badge bg="light" text="dark" className="border ms-1 small">
                {schedulePatterns?.length || 0}
              </Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeMainTab === 'jobs' && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div style={{ minWidth: '220px' }}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-white border-end-0 text-muted">
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search jobs..."
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
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAUSED">Paused Only</option>
            </Form.Select>

            <Form.Select
              size="sm"
              style={{ width: 'auto' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Task Types</option>
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
            className="d-flex align-items-center gap-1.5 py-1.5 px-3 fw-medium ms-auto"
            onClick={() => setShowPatternModal(true)}
          >
            <Plus size={15} />
            <span>Create Pattern Master</span>
          </Button>
        )}
      </div>

      {activeMainTab === 'jobs' ? (
        <>
          {isJobsLoading ? (
            <div className="text-center py-5 bg-white border rounded-3">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted small mt-2">Loading schedules...</p>
            </div>
          ) : (
            <CronJobTable
              jobs={filteredJobs}
              onEdit={handleOpenEditModal}
              onPause={(id) => pauseMutation.mutate(id)}
              onResume={(id) => resumeMutation.mutate(id)}
              onTrigger={(id) => triggerMutation.mutate(id)}
              onDelete={(id) => {
                if (window.confirm('Are you sure you want to delete this scheduled job?')) {
                  deleteMutation.mutate(id);
                }
              }}
              onViewLogs={handleViewLogs}
              onCreateNew={handleOpenCreateModal}
            />
          )}
        </>
      ) : (
        <>
          <div className="mb-3">
            <h6 className="fw-bold mb-1 text-dark">Schedule Pattern Master Catalog</h6>
            <p className="text-muted small mb-0">
              Pick a pre-configured Windows Task Scheduler recurrence pattern or create a new custom template for one-click assignment.
            </p>
          </div>
          <PatternMasterList
            patterns={schedulePatterns}
            onDelete={(id) => {
              if (window.confirm('Are you sure you want to delete this custom pattern template?')) {
                deletePatternMutation.mutate(id);
              }
            }}
            onApplyPattern={handleApplyPatternToJob}
            onCreateNew={() => setShowPatternModal(true)}
          />
        </>
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
