import React from 'react';
import { Modal, Table, Spinner, Badge } from 'react-bootstrap';
import { StatusBadge } from './StatusBadge';

export const CronJobLogModal = ({ show, onHide, logs, isLoading, jobName }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg" contentClassName="modal-content-dark">
      <Modal.Header closeButton closeVariant="white" className="modal-header-dark">
        <Modal.Title className="h5 font-semibold">
          Execution History — <span className="text-info">{jobName || 'Cron Job'}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted small mt-2">Loading execution logs...</p>
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-4 text-muted">
            No execution logs recorded yet for this job.
          </div>
        ) : (
          <Table hover className="custom-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Status</th>
                <th>Executed At</th>
                <th>Duration</th>
                <th>Execution Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="small text-muted">
                    {new Date(log.runAt || log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {log.executionTimeMs !== null ? (
                      <span className="badge bg-dark border border-secondary text-light">
                        {log.executionTimeMs} ms
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {log.status === 'FAILED' ? (
                      <pre className="text-danger small mb-0 json-viewer">
                        {log.errorDetails || 'Execution failed'}
                      </pre>
                    ) : log.result ? (
                      <pre className="mb-0 json-viewer">
                        {JSON.stringify(log.result, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted small">Job in progress...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
    </Modal>
  );
};
