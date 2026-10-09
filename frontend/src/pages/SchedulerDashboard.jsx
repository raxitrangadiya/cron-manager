import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Activity, CheckCircle2, PauseCircle, AlertTriangle } from 'lucide-react';

import {
  getMetrics,
  getJobs,
  getJobTypes,
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

export const SchedulerDashboard = () => {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

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
          className="mb-4 bg-opacity-20 border-opacity-30 text-white"
        >
          {alertMsg.text}
        </Alert>
      )}

      {/* Metrics Row */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Total Schedules</span>
              <Activity size={20} className="text-indigo-400" color="#818cf8" />
            </div>
            <div className="metric-value text-white">
              {isMetricsLoading ? '...' : metrics?.totalJobs || 0}
            </div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Active Schedules</span>
              <CheckCircle2 size={20} color="#34d399" />
            </div>
            <div className="metric-value text-success">
              {isMetricsLoading ? '...' : metrics?.activeJobs || 0}
            </div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Paused Schedules</span>
              <PauseCircle size={20} color="#fbbf24" />
            </div>
            <div className="metric-value text-warning">
              {isMetricsLoading ? '...' : metrics?.pausedJobs || 0}
            </div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Failed Executions</span>
              <AlertTriangle size={20} color="#f87171" />
            </div>
            <div className="metric-value text-danger">
              {isMetricsLoading ? '...' : metrics?.failedLogs || 0}
            </div>
          </div>
        </Col>
      </Row>

      {/* Header Actions */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="fw-bold mb-1 text-white">Scheduled Jobs</h4>
          <p className="text-muted small mb-0">
            Dynamic cron engine backed by PostgreSQL & BullMQ distributed queue.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            className="d-flex align-items-center gap-2 border-opacity-50"
            onClick={() => refetchJobs()}
          >
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button
            className="btn-primary-gradient d-flex align-items-center gap-2"
            onClick={handleOpenCreateModal}
          >
            <Plus size={18} /> Create New Job
          </Button>
        </div>
      </div>

      {/* Main Table */}
      {isJobsLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted small mt-2">Loading cron schedules...</p>
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

      {/* Create / Edit Modal */}
      <CronJobModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingJob(null);
        }}
        onSubmit={handleFormSubmit}
        jobTypes={jobTypes}
        initialValues={editingJob}
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
