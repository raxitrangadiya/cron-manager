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

  // Relative Position Options
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
      <Modal.Header closeButton className="py-2.5 px-3">
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-1.5">
          <Calendar size={17} className="text-primary" />
          <span>New Schedule Pattern Master</span>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-3">
          {errorMsg && <Alert variant="danger" className="py-1 px-2.5 mb-2 small">{errorMsg}</Alert>}

          <Row className="g-2 mb-2">
            <Col md={7}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Pattern Master Name</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="e.g. Month-End Financial Audit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Recurrence Type</Form.Label>
                <Form.Select
                  size="sm"
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                >
                  <option value="INTERVAL">Interval (Minutes)</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY_DATE">Monthly (Date)</option>
                  <option value="MONTHLY_RELATIVE">Monthly (Weekday)</option>
                  <option value="SEMI_ANNUALLY">Semi-Annually</option>
                  <option value="YEARLY_DATE">Annually (Date)</option>
                  <option value="YEARLY_RELATIVE">Annually (Weekday)</option>
                  <option value="ONCE">One-Time</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold">Description</Form.Label>
            <Form.Control
              size="sm"
              type="text"
              placeholder="e.g. Runs every weekday morning at 9:00 AM"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          {/* Trigger Parameters Box */}
          <div className="p-2.5 bg-light rounded border mb-2">
            {scheduleType === 'INTERVAL' && (
              <Row className="g-2 align-items-center">
                <Col sm={6}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Interval</Form.Label>
                  <Form.Select
                    size="sm"
                    value={intervalMin}
                    onChange={(e) => setIntervalMin(e.target.value)}
                  >
                    <option value="1">Every 1 minute</option>
                    <option value="5">Every 5 minutes</option>
                    <option value="10">Every 10 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every 60 minutes</option>
                  </Form.Select>
                </Col>
              </Row>
            )}

            {scheduleType === 'DAILY' && (
              <Row className="g-2 align-items-center">
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Time</Form.Label>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Repeat Every</Form.Label>
                  <div className="input-group input-group-sm">
                    <Form.Control
                      type="number"
                      min="1"
                      max="30"
                      value={repeatEvery}
                      onChange={(e) => setRepeatEvery(e.target.value)}
                    />
                    <span className="input-group-text bg-white" style={{ fontSize: '0.72rem' }}>Days</span>
                  </div>
                </Col>
                <Col sm={4} className="pt-3">
                  <Form.Check
                    type="switch"
                    id="skip-weekends-switch-sm"
                    label="Exclude Weekends"
                    className="small"
                    style={{ fontSize: '0.75rem' }}
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                  />
                </Col>
              </Row>
            )}

            {scheduleType === 'WEEKLY' && (
              <div>
                <Row className="g-2 align-items-center mb-2">
                  <Col sm={4}>
                    <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Start Time</Form.Label>
                    <Form.Control
                      size="sm"
                      type="time"
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                    />
                  </Col>
                </Row>
                <div className="d-flex flex-wrap gap-1">
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
                        className="py-0 px-2"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleToggleDay(day.id)}
                      >
                        {day.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {scheduleType === 'MONTHLY_DATE' && (
              <Row className="g-2 align-items-center">
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Day of Month</Form.Label>
                  <Form.Select
                    size="sm"
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
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Time</Form.Label>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Repeat Every</Form.Label>
                  <div className="input-group input-group-sm">
                    <Form.Control
                      type="number"
                      min="1"
                      max="12"
                      value={repeatEvery}
                      onChange={(e) => setRepeatEvery(e.target.value)}
                    />
                    <span className="input-group-text bg-white" style={{ fontSize: '0.72rem' }}>Months</span>
                  </div>
                </Col>
              </Row>
            )}

            {scheduleType === 'MONTHLY_RELATIVE' && (
              <Row className="g-2 align-items-center">
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Position</Form.Label>
                  <Form.Select
                    size="sm"
                    value={relativePos}
                    onChange={(e) => setRelativePos(e.target.value)}
                  >
                    <option value="1-7">1st</option>
                    <option value="8-14">2nd</option>
                    <option value="15-21">3rd</option>
                    <option value="22-28">4th</option>
                  </Form.Select>
                </Col>
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Weekday</Form.Label>
                  <Form.Select
                    size="sm"
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
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Time</Form.Label>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {scheduleType === 'SEMI_ANNUALLY' && (
              <Row className="g-2 align-items-center">
                <Col sm={6}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Day (Jan & Jul)</Form.Label>
                  <Form.Select
                    size="sm"
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
                <Col sm={6}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Time</Form.Label>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {scheduleType === 'YEARLY_DATE' && (
              <Row className="g-2 align-items-center">
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Month</Form.Label>
                  <Form.Select
                    size="sm"
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
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Day</Form.Label>
                  <Form.Select
                    size="sm"
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
                <Col sm={4}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Time</Form.Label>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {scheduleType === 'ONCE' && (
              <Row className="g-2 align-items-center">
                <Col sm={6}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Date</Form.Label>
                  <Form.Control
                    size="sm"
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                  />
                </Col>
                <Col sm={6}>
                  <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Time</Form.Label>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}
          </div>

          {/* Generated Preview */}
          <div className="d-flex align-items-center justify-content-between p-1.5 px-2 bg-white rounded border">
            <div className="d-flex align-items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Summary:</span>
              <span className="text-primary fw-medium small" style={{ fontSize: '0.78rem' }}>{humanReadable}</span>
            </div>
            <code className="cron-code">{cronExpression}</code>
          </div>
        </Modal.Body>
        <Modal.Footer className="py-2 px-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Pattern Master
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
