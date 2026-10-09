import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { cronToHumanReadable } from '../utils/cronHumanizer';

export const PatternMasterModal = ({ show, onHide, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState('DAILY');

  // Parameters
  const [intervalMin, setIntervalMin] = useState('15');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [errorMsg, setErrorMsg] = useState(null);

  const calculateCron = () => {
    const [hStr, mStr] = timeOfDay.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;

    switch (scheduleType) {
      case 'INTERVAL':
        return `*/${intervalMin} * * * *`;
      case 'DAILY':
        return `${m} ${h} * * *`;
      case 'WEEKLY':
        return `${m} ${h} * * ${selectedDays.join(',') || '1'}`;
      case 'MONTHLY':
        return `${m} ${h} ${dayOfMonth} * *`;
      default:
        return '0 9 * * *';
    }
  };

  const cronExpression = calculateCron();
  const humanReadable = cronToHumanReadable(cronExpression);

  const toggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length === 1) return; // Keep at least 1 day
      setSelectedDays(selectedDays.filter((d) => d !== dayNum));
    } else {
      setSelectedDays([...selectedDays, dayNum].sort());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a pattern name.');
      return;
    }
    onSubmit({
      name,
      description,
      scheduleType,
      cronExpression
    });
    setName('');
    setDescription('');
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold">
          Create Schedule Pattern Master (Windows Task Scheduler Style)
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Pattern Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Workday Morning Run"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Trigger Frequency</Form.Label>
                <Form.Select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                >
                  <option value="INTERVAL">Repeat at Minute Interval</option>
                  <option value="DAILY">Daily (At specific time)</option>
                  <option value="WEEKLY">Weekly (Specific Days & Time)</option>
                  <option value="MONTHLY">Monthly (Specific Day of Month)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Triggers every weekday at 9:00 AM for business reports"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Trigger Details Configuration Box */}
          <div className="border rounded-3 p-3 bg-light mb-3">
            <h6 className="fw-bold mb-3">Recurrence Settings</h6>

            {scheduleType === 'INTERVAL' && (
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Repeat Every</Form.Label>
                <Form.Select
                  value={intervalMin}
                  onChange={(e) => setIntervalMin(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="1">1 Minute</option>
                  <option value="5">5 Minutes</option>
                  <option value="10">10 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                </Form.Select>
              </Form.Group>
            )}

            {(scheduleType === 'DAILY' || scheduleType === 'WEEKLY' || scheduleType === 'MONTHLY') && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  style={{ maxWidth: '200px' }}
                />
              </Form.Group>
            )}

            {scheduleType === 'WEEKLY' && (
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold d-block">Recur on Days of Week</Form.Label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { num: 1, label: 'Mon' },
                    { num: 2, label: 'Tue' },
                    { num: 3, label: 'Wed' },
                    { num: 4, label: 'Thu' },
                    { num: 5, label: 'Fri' },
                    { num: 6, label: 'Sat' },
                    { num: 0, label: 'Sun' }
                  ].map((d) => (
                    <Button
                      key={d.num}
                      type="button"
                      size="sm"
                      variant={selectedDays.includes(d.num) ? 'primary' : 'outline-secondary'}
                      onClick={() => toggleDay(d.num)}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            )}

            {scheduleType === 'MONTHLY' && (
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Day of the Month</Form.Label>
                <Form.Select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Alert variant="info" className="mb-0 mt-3 py-2 px-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="fw-semibold">Generated Schedule:</span> {humanReadable}
              </div>
              <code className="bg-white px-2 py-1 border rounded text-dark small">{cronExpression}</code>
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Pattern Master
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
