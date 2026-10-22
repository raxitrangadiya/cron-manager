import React from 'react';
import { Modal, Table, Spinner, Badge } from 'react-bootstrap';
import { StatusBadge } from './StatusBadge';
import { Clock, History, AlertCircle } from 'lucide-react';

export const CronJobLogModal = ({ show, onHide, logs, isLoading, jobName }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="py-2.5 px-3">
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-1.5">
          <History size={16} className="text-primary" />
          <span>Execution History: <span className="text-primary">{jobName || 'Cron Job'}</span></span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" variant="primary" />
            <span className="text-muted small ms-2" style={{ fontSize: '0.78rem' }}>Loading logs...</span>
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <div className="p-2 bg-light rounded-circle d-inline-flex text-muted mb-1.5">
              <Clock size={20} />
            </div>
            <div className="fw-medium text-dark" style={{ fontSize: '0.82rem' }}>No executions recorded yet</div>
            <p className="small mb-0" style={{ fontSize: '0.74rem' }}>Logs will appear here once this job runs.</p>
          </div>
        ) : (
          <div className="table-responsive rounded border custom-table-container">
            <Table hover className="custom-table mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Status</th>
                  <th style={{ width: '170px' }}>Executed At</th>
                  <th style={{ width: '90px' }}>Duration</th>
                  <th>Execution Output</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="text-muted font-monospace" style={{ fontSize: '0.74rem' }}>
                      {new Date(log.runAt || log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {log.executionTimeMs !== null ? (
                        <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '0.7rem' }}>
                          {log.executionTimeMs}ms
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      {log.status === 'FAILED' ? (
                        <div className="p-1.5 bg-danger bg-opacity-10 text-danger rounded border border-danger border-opacity-25 font-monospace" style={{ fontSize: '0.72rem' }}>
                          <AlertCircle size={12} className="me-1 inline" />
                          {log.errorDetails || 'Execution failed'}
                        </div>
                      ) : log.result ? (
                        <pre className="json-viewer mb-0 py-1 px-2" style={{ maxHeight: '110px' }}>
                          {JSON.stringify(log.result, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted fst-italic" style={{ fontSize: '0.72rem' }}>In progress...</span>
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
