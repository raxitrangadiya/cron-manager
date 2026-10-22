import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Badge, Button, Table, Form, InputGroup } from 'react-bootstrap';
import { Trash2, Clock, CheckCircle2, LayoutGrid, List, Search, Plus, Calendar, ArrowRight } from 'lucide-react';
import { cronToHumanReadable } from '../utils/cronHumanizer';

export const PatternMasterList = ({ patterns = [], onDelete, onApplyPattern, onCreateNew }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'PRESET', 'CUSTOM'

  // Filter patterns
  const filteredPatterns = useMemo(() => {
    return patterns.filter((p) => {
      if (typeFilter === 'PRESET' && !p.isPreset) return false;
      if (typeFilter === 'CUSTOM' && p.isPreset) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(term);
        const matchesDesc = p.description?.toLowerCase().includes(term);
        const matchesCron = p.cronExpression?.toLowerCase().includes(term);
        const matchesType = p.scheduleType?.toLowerCase().includes(term);
        return matchesName || matchesDesc || matchesCron || matchesType;
      }
      return true;
    });
  }, [patterns, searchTerm, typeFilter]);

  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-center py-4 bg-white border rounded p-3 custom-table-container">
        <div className="p-2 bg-light rounded-circle d-inline-flex text-muted mb-2">
          <Clock size={24} />
        </div>
        <h6 className="fw-bold text-dark fs-6 mb-1">No schedule pattern templates found</h6>
        <p className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>
          Create reusable Windows Task Scheduler-style recurrence patterns for one-click assignment.
        </p>
        {onCreateNew && (
          <Button variant="primary" size="sm" onClick={onCreateNew}>
            + Create Pattern Master
          </Button>
        )}
      </div>
    );
  }

  const getScheduleTypeBadge = (type) => {
    switch (type) {
      case 'INTERVAL':
        return <Badge bg="info" bg-opacity="10" className="text-info border border-info border-opacity-25 fw-medium" style={{ fontSize: '0.7rem' }}>Interval</Badge>;
      case 'DAILY':
        return <Badge bg="success" bg-opacity="10" className="text-success border border-success border-opacity-25 fw-medium" style={{ fontSize: '0.7rem' }}>Daily</Badge>;
      case 'WEEKLY':
        return <Badge bg="primary" bg-opacity="10" className="text-primary border border-primary border-opacity-25 fw-medium" style={{ fontSize: '0.7rem' }}>Weekly</Badge>;
      case 'MONTHLY_DATE':
      case 'MONTHLY_RELATIVE':
        return <Badge bg="warning" bg-opacity="10" className="text-warning border border-warning border-opacity-25 fw-medium" style={{ fontSize: '0.7rem' }}>Monthly</Badge>;
      case 'SEMI_ANNUALLY':
        return <Badge bg="danger" bg-opacity="10" className="text-danger border border-danger border-opacity-25 fw-medium" style={{ fontSize: '0.7rem' }}>Semi-Annual</Badge>;
      case 'YEARLY_DATE':
      case 'YEARLY_RELATIVE':
        return <Badge bg="secondary" bg-opacity="10" className="text-secondary border border-secondary border-opacity-25 fw-medium" style={{ fontSize: '0.7rem' }}>Yearly</Badge>;
      case 'ONCE':
        return <Badge bg="light" text="dark" className="border fw-medium" style={{ fontSize: '0.7rem' }}>One-Time</Badge>;
      default:
        return <Badge bg="light" text="dark" className="border fw-medium" style={{ fontSize: '0.7rem' }}>{type || 'Standard'}</Badge>;
    }
  };

  return (
    <div>
      {/* Pattern Master Toolbar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '420px' }}>
          <InputGroup size="sm">
            <InputGroup.Text className="bg-white border-end-0 text-muted py-0 px-2">
              <Search size={13} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search templates..."
              className="border-start-0 ps-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Form.Select
            size="sm"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Templates</option>
            <option value="PRESET">Presets Only</option>
            <option value="CUSTOM">Custom Only</option>
          </Form.Select>
        </div>

        <div className="d-flex align-items-center gap-1.5">
          <div className="btn-group btn-group-sm" role="group">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline-secondary'}
              className="py-0.5 px-2 d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={13} /> Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
              className="py-0.5 px-2 d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <LayoutGrid size={13} /> Cards
            </Button>
          </div>

          {onCreateNew && (
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-1 py-0.5 px-2.5 fw-medium"
              style={{ fontSize: '0.75rem' }}
              onClick={onCreateNew}
            >
              <Plus size={13} /> Create Master
            </Button>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="custom-table-container table-responsive">
          <Table hover className="custom-table mb-0 align-middle">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Template Name & Purpose</th>
                <th style={{ width: '100px' }}>Category</th>
                <th style={{ width: '110px' }}>Recurrence</th>
                <th style={{ minWidth: '180px' }}>Schedule Summary</th>
                <th style={{ width: '110px' }}>Cron Syntax</th>
                <th className="text-end" style={{ width: '150px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatterns.map((pattern) => {
                const humanSchedule = cronToHumanReadable(pattern.cronExpression);

                return (
                  <tr key={pattern.id}>
                    <td>
                      <div className="fw-semibold text-dark fs-6" style={{ fontSize: '0.82rem' }}>{pattern.name}</div>
                      {pattern.description && (
                        <div className="text-muted text-truncate" style={{ fontSize: '0.74rem', maxWidth: '300px' }} title={pattern.description}>
                          {pattern.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {pattern.isPreset ? (
                        <Badge bg="primary" bg-opacity="10" className="text-primary border border-primary border-opacity-25 px-1.5 py-0.5 fw-normal" style={{ fontSize: '0.7rem' }}>
                          System Preset
                        </Badge>
                      ) : (
                        <Badge bg="secondary" bg-opacity="10" className="text-secondary border px-1.5 py-0.5 fw-normal" style={{ fontSize: '0.7rem' }}>
                          Custom
                        </Badge>
                      )}
                    </td>
                    <td>
                      {getScheduleTypeBadge(pattern.scheduleType)}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 text-primary fw-medium" style={{ fontSize: '0.78rem' }}>
                        <Clock size={12} className="text-primary" />
                        <span>{humanSchedule}</span>
                      </div>
                    </td>
                    <td>
                      <code className="cron-code">
                        {pattern.cronExpression}
                      </code>
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        {onApplyPattern && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="d-flex align-items-center gap-1 py-0.5 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => onApplyPattern(pattern)}
                            title="Schedule a job with this template"
                          >
                            <Calendar size={12} />
                            <span>Use Pattern</span>
                          </Button>
                        )}
                        {!pattern.isPreset && onDelete && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="py-0.5 px-1.5"
                            title="Delete template"
                            onClick={() => onDelete(pattern.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        /* Compact Card Grid View */
        <Row className="g-2">
          {filteredPatterns.map((pattern) => (
            <Col md={6} lg={4} key={pattern.id}>
              <Card className="border shadow-sm h-100 bg-white">
                <Card.Body className="d-flex flex-column justify-content-between p-2.5">
                  <div>
                    <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                      <span className="fw-bold text-dark text-truncate fs-6" style={{ fontSize: '0.82rem', maxWidth: '180px' }} title={pattern.name}>
                        {pattern.name}
                      </span>
                      {pattern.isPreset ? (
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-1.5 py-0.5" style={{ fontSize: '0.68rem' }}>
                          Preset
                        </span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border px-1.5 py-0.5" style={{ fontSize: '0.68rem' }}>
                          Custom
                        </span>
                      )}
                    </div>

                    <p className="text-muted mb-2 text-truncate" style={{ fontSize: '0.75rem' }} title={pattern.description}>
                      {pattern.description || cronToHumanReadable(pattern.cronExpression)}
                    </p>

                    <div className="p-2 bg-light rounded border mb-2">
                      <div className="fw-semibold text-primary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                        <Clock size={12} />
                        <span>{cronToHumanReadable(pattern.cronExpression)}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mt-1 pt-1 border-top" style={{ fontSize: '0.7rem' }}>
                        <span className="text-muted">Syntax:</span>
                        <code className="text-dark font-monospace bg-white px-1 py-0.2 rounded border">
                          {pattern.cronExpression}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-1.5 border-top gap-1.5">
                    {onApplyPattern && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="d-flex align-items-center justify-content-center gap-1 py-0.5 px-2 flex-grow-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => onApplyPattern(pattern)}
                      >
                        <Calendar size={12} /> Use Pattern
                      </Button>
                    )}
                    {!pattern.isPreset && onDelete && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="py-0.5 px-2"
                        title="Delete template"
                        onClick={() => onDelete(pattern.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
