import React from 'react';
import { Modal, Table, Spinner, Badge } from 'react-bootstrap';
import { StatusBadge } from './StatusBadge';
import { Clock, History, AlertCircle } from 'lucide-react';

export const CronJobLogModal = ({ show, onHide, logs, isLoading, jobName }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
          <History size={20} className="text-primary" />
          <span>Execution History: <span className="text-primary">{jobName || 'Cron Job'}</span></span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted small mt-2">Loading execution audit trail...</p>
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div className="p-3 bg-light rounded-circle d-inline-flex text-muted mb-2">
              <Clock size={28} />
            </div>
            <h6 className="fw-medium text-dark">No executions recorded yet</h6>
            <p className="small mb-0">Logs will automatically populate when this job runs according to schedule or on manual trigger.</p>
          </div>
        ) : (
          <div className="table-responsive rounded-3 border custom-table-container">
            <Table hover className="custom-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Execution Timestamp</th>
                  <th>Duration</th>
                  <th>Result Output</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="small text-muted font-monospace">
                      {new Date(log.runAt || log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {log.executionTimeMs !== null ? (
                        <span className="badge bg-light text-dark border font-monospace small">
                          {log.executionTimeMs} ms
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '350px' }}>
                      {log.status === 'FAILED' ? (
                        <div className="p-2 bg-danger bg-opacity-10 text-danger rounded border border-danger border-opacity-25 small font-monospace">
                          <AlertCircle size={14} className="me-1 inline" />
                          {log.errorDetails || 'Execution failed'}
                        </div>
                      ) : log.result ? (
                        <pre className="json-viewer mb-0">
                          {JSON.stringify(log.result, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted small fst-italic">Execution in progress...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};
