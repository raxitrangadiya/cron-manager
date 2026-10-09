import React from 'react';
import { Modal, Table, Spinner, Badge } from 'react-bootstrap';
import { StatusBadge } from './StatusBadge';

export const CronJobLogModal = ({ show, onHide, logs, isLoading, jobName }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold">
          Execution History — <span className="text-primary">{jobName || 'Cron Job'}</span>
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
          <Table hover responsive className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th>Status</th>
                <th>Executed At</th>
                <th>Duration</th>
                <th>Execution Output / Result</th>
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
                      <Badge bg="light" text="dark" className="border">
                        {log.executionTimeMs} ms
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {log.status === 'FAILED' ? (
                      <pre className="text-danger small mb-0 p-2 bg-light rounded border">
                        {log.errorDetails || 'Execution failed'}
                      </pre>
                    ) : log.result ? (
                      <pre className="text-primary small mb-0 p-2 bg-light rounded border">
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
