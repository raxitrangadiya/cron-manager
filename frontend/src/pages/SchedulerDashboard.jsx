import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Nav } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Calendar, CheckCircle2, PauseCircle, AlertTriangle, Layers } from 'lucide-react';

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

  const [showPatternModal, setShowPatternModal] = useState(false);

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobName, setSelectedJobName] = useState('');

  const [alertMsg, setAlertMsg] = useState(null);

  // Queries
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    refetchInterval: 5000
  });

  const { data: jobs, isLoading: isJobsLoading, refetch: refetchJobs } = useQuery({
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      setShowModal(false);
      setAlertMsg({ type: 'success', text: `Scheduled Job "${data.name}" created successfully!` });
    },
    onError: (err) => {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || err.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      setShowModal(false);
      setEditingJob(null);
      setAlertMsg({ type: 'success', text: `Job "${data.name}" updated successfully.` });
    },
    onError: (err) => {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || err.message });
    }
  });

  const pauseMutation = useMutation({
    mutationFn: pauseJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
    }
  });

  const resumeMutation = useMutation({
    mutationFn: resumeJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
    }
  });

  const triggerMutation = useMutation({
    mutationFn: triggerJobNow,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      setAlertMsg({ type: 'info', text: res.message || 'Job triggered successfully.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['metrics']);
      setAlertMsg({ type: 'warning', text: 'Job deleted successfully.' });
    }
  });

  const createPatternMutation = useMutation({
    mutationFn: createSchedulePattern,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['schedulePatterns']);
      setShowPatternModal(false);
      setAlertMsg({ type: 'success', text: `Schedule Pattern Master "${data.name}" created!` });
    },
    onError: (err) => {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || err.message });
    }
  });

  const deletePatternMutation = useMutation({
    mutationFn: deleteSchedulePattern,
    onSuccess: () => {
      queryClient.invalidateQueries(['schedulePatterns']);
      setAlertMsg({ type: 'warning', text: 'Schedule pattern master deleted.' });
    }
  });

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
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
    const job = jobs.find((j) => j.id === jobId);
    setSelectedJobId(jobId);
    setSelectedJobName(job ? job.name : '');
    setShowLogModal(true);
  };

  return (
    <div>
      {/* Alert Notice */}
      {alertMsg && (
        <Alert
          variant={alertMsg.type}
          dismissible
          onClose={() => setAlertMsg(null)}
          className="mb-4 shadow-sm"
        >
          {alertMsg.text}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
        <Nav variant="tabs" activeKey={activeMainTab} onSelect={(k) => setActiveMainTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="jobs" className="fw-semibold px-4">
              <Calendar size={16} className="me-2" /> Scheduled Jobs
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="patterns" className="fw-semibold px-4">
              <Layers size={16} className="me-2" /> Schedule Pattern Master (Task Scheduler)
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeMainTab === 'jobs' ? (
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-flex align-items-center gap-2"
              onClick={() => refetchJobs()}
            >
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-2 fw-semibold"
              onClick={handleOpenCreateModal}
            >
              <Plus size={16} /> Schedule New Job
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-2 fw-semibold"
            onClick={() => setShowPatternModal(true)}
          >
            <Plus size={16} /> Create Pattern Master
          </Button>
        )}
      </div>

      {activeMainTab === 'jobs' ? (
        <>
          {/* Metrics Row */}
          <Row className="g-3 mb-4">
            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase">Total Jobs</div>
                    <h3 className="fw-bold mb-0 text-dark">
                      {isMetricsLoading ? '...' : metrics?.totalJobs || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                    <Calendar size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase">Active</div>
                    <h3 className="fw-bold mb-0 text-success">
                      {isMetricsLoading ? '...' : metrics?.activeJobs || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                    <CheckCircle2 size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase">Paused</div>
                    <h3 className="fw-bold mb-0 text-warning">
                      {isMetricsLoading ? '...' : metrics?.pausedJobs || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                    <PauseCircle size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase">Failures</div>
                    <h3 className="fw-bold mb-0 text-danger">
                      {isMetricsLoading ? '...' : metrics?.failedLogs || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle">
                    <AlertTriangle size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Table */}
          {isJobsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted small mt-2">Loading schedules...</p>
            </div>
          ) : (
            <CronJobTable
              jobs={jobs || []}
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
            />
          )}
        </>
      ) : (
        <>
          <div className="mb-4">
            <h5 className="fw-bold mb-1 text-dark">Schedule Pattern Master Repository</h5>
            <p className="text-muted small mb-0">
              Configure and manage reusable, Windows Task Scheduler-style recurrence patterns for end users.
            </p>
          </div>
          <PatternMasterList
            patterns={schedulePatterns}
            onDelete={(id) => {
              if (window.confirm('Are you sure you want to delete this custom pattern master?')) {
                deletePatternMutation.mutate(id);
              }
            }}
            onApplyPattern={(pattern) => {
              setShowModal(true);
            }}
          />
        </>
      )}

      {/* Create / Edit Job Modal */}
      <CronJobModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingJob(null);
        }}
        onSubmit={handleFormSubmit}
        jobTypes={jobTypes}
        schedulePatterns={schedulePatterns}
        initialValues={editingJob}
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
