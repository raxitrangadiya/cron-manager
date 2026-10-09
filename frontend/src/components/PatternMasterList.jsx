import React from 'react';
import { Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { cronToHumanReadable } from '../utils/cronHumanizer';

export const PatternMasterList = ({ patterns, onDelete, onApplyPattern }) => {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-center py-5 bg-white border rounded-3">
        <p className="text-muted mb-0">No custom schedule pattern masters created yet.</p>
      </div>
    );
  }

  return (
    <Row className="g-3">
      {patterns.map((pattern) => (
        <Col md={6} lg={4} key={pattern.id}>
          <Card className="border shadow-sm h-100">
            <Card.Body className="d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold text-dark">{pattern.name}</span>
                  {pattern.isPreset ? (
                    <Badge bg="primary" className="fw-normal">
                      System Preset
                    </Badge>
                  ) : (
                    <Badge bg="light" text="dark" className="border fw-normal">
                      Custom Master
                    </Badge>
                  )}
                </div>
                {pattern.description && (
                  <p className="text-muted small mb-2">{pattern.description}</p>
                )}
                <div className="p-2 bg-light rounded border mb-3">
                  <div className="small fw-semibold text-primary d-flex align-items-center gap-1">
                    <Clock size={14} /> {cronToHumanReadable(pattern.cronExpression)}
                  </div>
                  <code className="text-muted small d-block mt-1">{pattern.cronExpression}</code>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                {onApplyPattern && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center gap-1"
                    onClick={() => onApplyPattern(pattern)}
                  >
                    <CheckCircle2 size={14} /> Use This Pattern
                  </Button>
                )}
                {!pattern.isPreset && onDelete && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="ms-auto"
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
