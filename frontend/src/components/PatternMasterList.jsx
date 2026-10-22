import React from 'react';
import { Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Trash2, Clock, CheckCircle2, Copy } from 'lucide-react';
import { cronToHumanReadable } from '../utils/cronHumanizer';

export const PatternMasterList = ({ patterns, onDelete, onApplyPattern, onCreateNew }) => {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-center py-5 bg-white border rounded-3 p-4">
        <div className="p-3 bg-light rounded-circle d-inline-flex text-muted mb-3">
          <Clock size={32} />
        </div>
        <h6 className="fw-bold text-dark">No schedule pattern templates found</h6>
        <p className="text-muted small mb-3">
          Create reusable Windows Task Scheduler-style recurrence patterns for end users to select with a single click.
        </p>
        {onCreateNew && (
          <Button variant="primary" size="sm" onClick={onCreateNew}>
            + Create Pattern Master
          </Button>
        )}
      </div>
    );
  }

  return (
    <Row className="g-3">
      {patterns.map((pattern) => (
        <Col md={6} lg={4} key={pattern.id}>
          <Card className="border shadow-sm h-100 bg-white">
            <Card.Body className="d-flex flex-column justify-content-between p-3.5">
              <div>
                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <h6 className="fw-bold text-dark mb-0 fs-6">{pattern.name}</h6>
                  {pattern.isPreset ? (
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 fw-medium" style={{ fontSize: '0.72rem' }}>
                      System Preset
                    </span>
                  ) : (
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 fw-medium" style={{ fontSize: '0.72rem' }}>
                      Custom Template
                    </span>
                  )}
                </div>

                <p className="text-muted small mb-3" style={{ minHeight: '38px', lineHeight: '1.4' }}>
                  {pattern.description || cronToHumanReadable(pattern.cronExpression)}
                </p>

                <div className="p-2.5 bg-light rounded-2 border mb-3">
                  <div className="small fw-semibold text-primary d-flex align-items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    <span>{cronToHumanReadable(pattern.cronExpression)}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-1 pt-1 border-top border-secondary border-opacity-10">
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Cron Expression:</span>
                    <code className="text-dark font-monospace small bg-white px-1.5 py-0.5 rounded border">
                      {pattern.cronExpression}
                    </code>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between pt-2.5 border-top gap-2">
                {onApplyPattern && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center gap-1.5 py-1 px-3 small fw-medium"
                    onClick={() => onApplyPattern(pattern)}
                  >
                    <CheckCircle2 size={14} /> Use Template
                  </Button>
                )}
                {!pattern.isPreset && onDelete && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="ms-auto py-1 px-2.5"
                    title="Delete pattern template"
                    onClick={() => onDelete(pattern.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
