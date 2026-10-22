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
      <div className="text-center py-5 bg-white border rounded-3 p-4 custom-table-container">
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

  const getScheduleTypeBadge = (type) => {
    switch (type) {
      case 'INTERVAL':
        return <Badge bg="info" bg-opacity="10" className="text-info border border-info border-opacity-25 fw-medium">Interval</Badge>;
      case 'DAILY':
        return <Badge bg="success" bg-opacity="10" className="text-success border border-success border-opacity-25 fw-medium">Daily</Badge>;
      case 'WEEKLY':
        return <Badge bg="primary" bg-opacity="10" className="text-primary border border-primary border-opacity-25 fw-medium">Weekly</Badge>;
      case 'MONTHLY_DATE':
      case 'MONTHLY_RELATIVE':
        return <Badge bg="warning" bg-opacity="10" className="text-warning border border-warning border-opacity-25 fw-medium">Monthly</Badge>;
      case 'SEMI_ANNUALLY':
        return <Badge bg="danger" bg-opacity="10" className="text-danger border border-danger border-opacity-25 fw-medium">Semi-Annual</Badge>;
      case 'YEARLY_DATE':
      case 'YEARLY_RELATIVE':
        return <Badge bg="secondary" bg-opacity="10" className="text-secondary border border-secondary border-opacity-25 fw-medium">Yearly</Badge>;
      case 'ONCE':
        return <Badge bg="light" text="dark" className="border fw-medium">One-Time</Badge>;
      default:
        return <Badge bg="light" text="dark" className="border fw-medium">{type || 'Standard'}</Badge>;
    }
  };

  return (
    <div>
      {/* Pattern Master Toolbar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2.5 mb-3">
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '450px' }}>
          <InputGroup size="sm">
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <Search size={14} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search pattern templates..."
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
            <option value="ALL">All Categories</option>
            <option value="PRESET">Presets Only</option>
            <option value="CUSTOM">Custom Masters</option>
          </Form.Select>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* View Toggle */}
          <div className="btn-group btn-group-sm" role="group">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline-secondary'}
              className="py-1 px-2.5 d-flex align-items-center gap-1"
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={14} /> Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
              className="py-1 px-2.5 d-flex align-items-center gap-1"
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <LayoutGrid size={14} /> Cards
            </Button>
          </div>

          {onCreateNew && (
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-1.5 py-1 px-3 fw-medium"
              onClick={onCreateNew}
            >
              <Plus size={15} /> Create Master
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
                <th>Pattern Name & Description</th>
                <th>Category</th>
                <th>Recurrence Type</th>
                <th>Schedule Summary</th>
                <th>Cron Expression</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatterns.map((pattern) => {
                const humanSchedule = cronToHumanReadable(pattern.cronExpression);

                return (
                  <tr key={pattern.id}>
                    <td style={{ maxWidth: '280px' }}>
                      <div className="fw-semibold text-dark fs-6">{pattern.name}</div>
                      {pattern.description && (
                        <div className="text-muted small text-truncate" title={pattern.description}>
                          {pattern.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {pattern.isPreset ? (
                        <Badge bg="primary" bg-opacity="10" className="text-primary border border-primary border-opacity-25 px-2 py-1 fw-medium" style={{ fontSize: '0.72rem' }}>
                          System Preset
                        </Badge>
                      ) : (
                        <Badge bg="secondary" bg-opacity="10" className="text-secondary border px-2 py-1 fw-medium" style={{ fontSize: '0.72rem' }}>
                          Custom Master
                        </Badge>
                      )}
                    </td>
                    <td>
                      {getScheduleTypeBadge(pattern.scheduleType)}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5 text-primary fw-medium small">
                        <Clock size={13} className="text-primary" />
                        <span>{humanSchedule}</span>
                      </div>
                    </td>
                    <td>
                      <code className="cron-code">
                        {pattern.cronExpression}
                      </code>
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        {onApplyPattern && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="d-flex align-items-center gap-1.5 py-1 px-2.5 small"
                            onClick={() => onApplyPattern(pattern)}
                            title="Schedule a job using this pattern"
                          >
                            <Calendar size={13} />
                            <span>Schedule Job</span>
                            <ArrowRight size={12} />
                          </Button>
                        )}
                        {!pattern.isPreset && onDelete && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="py-1 px-2"
                            title="Delete pattern master"
                            onClick={() => onDelete(pattern.id)}
                          >
                            <Trash2 size={13} />
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
        /* Card Grid View */
        <Row className="g-3">
          {filteredPatterns.map((pattern) => (
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
                          Custom Master
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
                        variant="primary"
                        size="sm"
                        className="d-flex align-items-center gap-1.5 py-1 px-3 small fw-medium flex-grow-1 justify-content-center"
                        onClick={() => onApplyPattern(pattern)}
                      >
                        <Calendar size={14} /> Schedule Job with this Pattern
                      </Button>
                    )}
                    {!pattern.isPreset && onDelete && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="py-1 px-2.5"
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
      )}
    </div>
  );
};
