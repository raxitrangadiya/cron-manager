import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { cronToHumanReadable } from '../utils/cronHumanizer';
import cronParser from 'cron-parser';
import { Calendar, Clock, Sparkles } from 'lucide-react';

const MONTH_NAMES = [
  { val: 1, name: 'January' },
  { val: 2, name: 'February' },
  { val: 3, name: 'March' },
  { val: 4, name: 'April' },
  { val: 5, name: 'May' },
  { val: 6, name: 'June' },
  { val: 7, name: 'July' },
  { val: 8, name: 'August' },
  { val: 9, name: 'September' },
  { val: 10, name: 'October' },
  { val: 11, name: 'November' },
  { val: 12, name: 'December' }
];

export const PatternMasterModal = ({ show, onHide, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState('DAILY');

  // Advanced Options
  const [repeatEvery, setRepeatEvery] = useState('1');
  const [skipWeekends, setSkipWeekends] = useState(false);

  // Trigger Parameters
  const [intervalMin, setIntervalMin] = useState('15');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [specificDate, setSpecificDate] = useState('2026-10-15');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [monthOfYear, setMonthOfYear] = useState('1');

  // Relative Position Options (1st, 2nd, 3rd, 4th)
  const [relativePos, setRelativePos] = useState('1-7');
  const [relativeDay, setRelativeDay] = useState('1');

  const [errorMsg, setErrorMsg] = useState(null);

  const calculateCron = () => {
    const [hStr, mStr] = (timeOfDay || '09:00').split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const everyN = parseInt(repeatEvery, 10) || 1;

    switch (scheduleType) {
      case 'ONCE': {
        if (!specificDate) return '0 9 15 10 *';
        const d = new Date(specificDate);
        const day = d.getDate() || 15;
        const month = d.getMonth() + 1 || 10;
        return `${m} ${h} ${day} ${month} *`;
      }
      case 'INTERVAL':
        return `*/${intervalMin} * * * *`;
      case 'DAILY':
        if (skipWeekends) return `${m} ${h} * * 1-5`;
        if (everyN > 1) return `${m} ${h} */${everyN} * *`;
        return `${m} ${h} * * *`;
      case 'WEEKLY':
        return `${m} ${h} * * ${selectedDays.length > 0 ? selectedDays.join(',') : '1'}`;
      case 'MONTHLY_DATE':
        if (everyN > 1) return `${m} ${h} ${dayOfMonth} */${everyN} *`;
        return `${m} ${h} ${dayOfMonth} * *`;
      case 'MONTHLY_RELATIVE':
        return `${m} ${h} ${relativePos} * ${relativeDay}`;
      case 'SEMI_ANNUALLY':
        return `${m} ${h} ${dayOfMonth} 1,7 *`;
      case 'YEARLY_DATE':
        return `${m} ${h} ${dayOfMonth} ${monthOfYear} *`;
      case 'YEARLY_RELATIVE':
        return `${m} ${h} ${relativePos} ${monthOfYear} ${relativeDay}`;
      default:
        return '0 9 * * *';
    }
  };

  const cronExpression = calculateCron();
  const humanReadable = cronToHumanReadable(cronExpression);

  // Calculate next 3 execution dates for live preview
  const getNextRunsPreview = () => {
    try {
      const interval = cronParser.parseExpression(cronExpression, { tz: 'Asia/Kolkata' });
      const runs = [];
      for (let i = 0; i < 3; i++) {
        runs.push(interval.next().toDate().toLocaleString());
      }
      return runs;
    } catch (e) {
      return [];
    }
  };

  const nextRunsPreview = getNextRunsPreview();

  const handleToggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayNum));
      }
    } else {
      setSelectedDays([...selectedDays, dayNum].sort());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a pattern name.');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || humanReadable,
      scheduleType,
      repeatIntervalMinutes: scheduleType === 'INTERVAL' ? parseInt(intervalMin, 10) : null,
      timeOfDay: scheduleType !== 'INTERVAL' ? timeOfDay : null,
      daysOfWeek: scheduleType === 'WEEKLY' ? selectedDays : null,
      dayOfMonth:
        scheduleType === 'MONTHLY_DATE' || scheduleType === 'SEMI_ANNUALLY' || scheduleType === 'YEARLY_DATE'
          ? parseInt(dayOfMonth, 10)
          : null,
      cronExpression,
      repeatEvery: parseInt(repeatEvery, 10) || 1,
      skipWeekends
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
          <Calendar size={20} className="text-primary" />
          <span>New Schedule Pattern Master</span>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

          <Row className="g-3 mb-3">
            <Col md={7}>
              <Form.Group>
                <Form.Label className="fw-semibold">Pattern Master Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. End of Month Financial Closing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label className="fw-semibold">Trigger Frequency</Form.Label>
                <Form.Select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                >
                  <option value="INTERVAL">Repeating Interval (Minutes)</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly (Specific Days)</option>
                  <option value="MONTHLY_DATE">Monthly (Specific Date)</option>
                  <option value="MONTHLY_RELATIVE">Monthly (Relative Weekday)</option>
                  <option value="SEMI_ANNUALLY">Semi-Annually (Every 6 Months)</option>
                  <option value="YEARLY_DATE">Annually (Specific Date & Month)</option>
                  <option value="YEARLY_RELATIVE">Annually (Relative Day & Month)</option>
                  <option value="ONCE">One Time (Specific Date)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Description / Purpose</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Triggers automated payroll report for factory operations"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          {/* Trigger Configuration Panel */}
          <div className="border rounded-3 p-3 bg-light mb-3">
            <h6 className="fw-bold mb-3 text-dark">Recurrence Parameters</h6>

            {/* INTERVAL */}
            {scheduleType === 'INTERVAL' && (
              <Row className="g-3 align-items-center">
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-secondary">Repeat Interval</Form.Label>
                  <Form.Select
                    value={intervalMin}
                    onChange={(e) => setIntervalMin(e.target.value)}
                  >
                    <option value="1">Every 1 minute</option>
                    <option value="5">Every 5 minutes</option>
                    <option value="10">Every 10 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="45">Every 45 minutes</option>
                    <option value="60">Every 60 minutes</option>
                  </Form.Select>
                </Col>
              </Row>
            )}

            {/* DAILY */}
            {scheduleType === 'DAILY' && (
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Recur Every</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="number"
                      min="1"
                      max="30"
                      value={repeatEvery}
                      onChange={(e) => setRepeatEvery(e.target.value)}
                    />
                    <span className="input-group-text bg-white small">Days</span>
                  </div>
                </Col>
                <Col md={4} className="pt-3">
                  <Form.Check
                    type="switch"
                    id="skip-weekends-switch"
                    label="Exclude Weekends (Mon-Fri only)"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                  />
                </Col>
              </Row>
            )}

            {/* WEEKLY */}
            {scheduleType === 'WEEKLY' && (
              <div>
                <Row className="g-3 align-items-center mb-3">
                  <Col md={4}>
                    <Form.Label className="small fw-semibold text-secondary">Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                    />
                  </Col>
                </Row>
                <Form.Label className="small fw-semibold text-secondary d-block">Run on Days of the Week</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    { id: 1, label: 'Mon' },
                    { id: 2, label: 'Tue' },
                    { id: 3, label: 'Wed' },
                    { id: 4, label: 'Thu' },
                    { id: 5, label: 'Fri' },
                    { id: 6, label: 'Sat' },
                    { id: 0, label: 'Sun' }
                  ].map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <Button
                        key={day.id}
                        type="button"
                        variant={isSelected ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="px-3"
                        onClick={() => handleToggleDay(day.id)}
                      >
                        {day.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MONTHLY SPECIFIC DATE */}
            {scheduleType === 'MONTHLY_DATE' && (
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Day of the Month</Form.Label>
                  <Form.Select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Day {d} of month
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Recur Every</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="number"
                      min="1"
                      max="12"
                      value={repeatEvery}
                      onChange={(e) => setRepeatEvery(e.target.value)}
                    />
                    <span className="input-group-text bg-white small">Months</span>
                  </div>
                </Col>
              </Row>
            )}

            {/* MONTHLY RELATIVE WEEKDAY */}
            {scheduleType === 'MONTHLY_RELATIVE' && (
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Relative Position</Form.Label>
                  <Form.Select
                    value={relativePos}
                    onChange={(e) => setRelativePos(e.target.value)}
                  >
                    <option value="1-7">First</option>
                    <option value="8-14">Second</option>
                    <option value="15-21">Third</option>
                    <option value="22-28">Fourth</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Weekday</Form.Label>
                  <Form.Select
                    value={relativeDay}
                    onChange={(e) => setRelativeDay(e.target.value)}
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {/* SEMI ANNUALLY */}
            {scheduleType === 'SEMI_ANNUALLY' && (
              <Row className="g-3 align-items-center">
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-secondary">Day of Semi-Annual Run (Jan & Jul)</Form.Label>
                  <Form.Select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Day {d} of January and July
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-secondary">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {/* YEARLY DATE */}
            {scheduleType === 'YEARLY_DATE' && (
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Month</Form.Label>
                  <Form.Select
                    value={monthOfYear}
                    onChange={(e) => setMonthOfYear(e.target.value)}
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m.val} value={m.val}>
                        {m.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Day of Month</Form.Label>
                  <Form.Select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-secondary">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {/* YEARLY RELATIVE */}
            {scheduleType === 'YEARLY_RELATIVE' && (
              <Row className="g-3 align-items-center">
                <Col md={3}>
                  <Form.Label className="small fw-semibold text-secondary">Position</Form.Label>
                  <Form.Select
                    value={relativePos}
                    onChange={(e) => setRelativePos(e.target.value)}
                  >
                    <option value="1-7">First</option>
                    <option value="8-14">Second</option>
                    <option value="15-21">Third</option>
                    <option value="22-28">Fourth</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-semibold text-secondary">Weekday</Form.Label>
                  <Form.Select
                    value={relativeDay}
                    onChange={(e) => setRelativeDay(e.target.value)}
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-semibold text-secondary">Month</Form.Label>
                  <Form.Select
                    value={monthOfYear}
                    onChange={(e) => setMonthOfYear(e.target.value)}
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m.val} value={m.val}>
                        {m.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-semibold text-secondary">Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {/* ONCE */}
            {scheduleType === 'ONCE' && (
              <Row className="g-3 align-items-center">
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-secondary">Execution Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-secondary">Execution Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}
          </div>

          {/* Real-Time Live Preview & Next 3 Runs */}
          <div className="p-3 bg-white border rounded-3 mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold text-dark small d-flex align-items-center gap-1.5">
                <Sparkles size={15} className="text-primary" /> Generated Schedule Preview:
              </span>
              <code className="bg-light px-2 py-0.5 rounded border text-dark font-monospace small">
                {cronExpression}
              </code>
            </div>
            <div className="text-primary fw-medium mb-2 fs-6">{humanReadable}</div>

            {nextRunsPreview.length > 0 && (
              <div className="mt-2 pt-2 border-top">
                <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                  Next 3 Execution Times:
                </div>
                <div className="d-flex flex-column gap-1">
                  {nextRunsPreview.map((runTime, idx) => (
                    <div key={idx} className="small text-secondary d-flex align-items-center gap-2">
                      <Clock size={12} className="text-muted" />
                      <span>{runTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
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
