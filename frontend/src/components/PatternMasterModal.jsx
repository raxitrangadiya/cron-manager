import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { cronToHumanReadable } from '../utils/cronHumanizer';
import cronParser from 'cron-parser';

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
    const [hStr, mStr] = timeOfDay.split(':');
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
        return `${m} ${h} * * ${selectedDays.join(',') || '1'}`;
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

  const toggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length === 1) return;
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
      repeatEvery: parseInt(repeatEvery, 10) || 1,
      skipWeekends,
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
                  placeholder="e.g. Semi-Annual Tax Audit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Recurrence Trigger Type</Form.Label>
                <Form.Select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                >
                  <option value="ONCE">One Time / Specific Date</option>
                  <option value="INTERVAL">Interval (Every X Minutes)</option>
                  <option value="DAILY">Daily (At specific time)</option>
                  <option value="WEEKLY">Weekly (Specific Days of Week)</option>
                  <option value="MONTHLY_DATE">Monthly (On specific Date)</option>
                  <option value="MONTHLY_RELATIVE">Monthly (On 1st/2nd/3rd Monday...)</option>
                  <option value="SEMI_ANNUALLY">Semi-Annually (Twice a Year)</option>
                  <option value="YEARLY_DATE">Annually / Yearly (On specific Date)</option>
                  <option value="YEARLY_RELATIVE">Annually / Yearly (On Relative Day)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Runs twice a year on January 1st and July 1st at 9:00 AM"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Windows Task Scheduler Recurrence Box */}
          <div className="border rounded-3 p-3 bg-light mb-3">
            <h6 className="fw-bold mb-3 text-dark">Task Scheduler Recurrence Settings</h6>

            {scheduleType === 'ONCE' && (
              <Row className="g-3 mb-2">
                <Col md={6}>
                  <Form.Label className="small fw-semibold">Execution Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-semibold">Execution Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
              </Row>
            )}

            {scheduleType === 'INTERVAL' && (
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Repeat Task Every</Form.Label>
                <Form.Select
                  value={intervalMin}
                  onChange={(e) => setIntervalMin(e.target.value)}
                  style={{ maxWidth: '250px' }}
                >
                  <option value="1">1 Minute</option>
                  <option value="5">5 Minutes</option>
                  <option value="10">10 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour (60 Mins)</option>
                </Form.Select>
              </Form.Group>
            )}

            {scheduleType !== 'ONCE' && scheduleType !== 'INTERVAL' && (
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Label className="small fw-semibold">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </Col>
                {(scheduleType === 'DAILY' || scheduleType === 'MONTHLY_DATE') && (
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Recur Every N {scheduleType === 'DAILY' ? 'Days' : 'Months'}</Form.Label>
                    <Form.Select
                      value={repeatEvery}
                      onChange={(e) => setRepeatEvery(e.target.value)}
                    >
                      <option value="1">Every 1 {scheduleType === 'DAILY' ? 'Day' : 'Month'}</option>
                      <option value="2">Every 2 {scheduleType === 'DAILY' ? 'Days' : 'Months'}</option>
                      <option value="3">Every 3 {scheduleType === 'DAILY' ? 'Days' : 'Months (Quarterly)'}</option>
                      <option value="6">Every 6 {scheduleType === 'DAILY' ? 'Days' : 'Months (Semi-Annually)'}</option>
                    </Form.Select>
                  </Col>
                )}
              </Row>
            )}

            {scheduleType === 'DAILY' && (
              <Form.Check
                type="checkbox"
                id="skip-weekends-check"
                label="Exclude Weekends (Run Mon-Fri only)"
                checked={skipWeekends}
                onChange={(e) => setSkipWeekends(e.target.checked)}
                className="mb-2 small fw-semibold text-secondary"
              />
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

            {(scheduleType === 'MONTHLY_DATE' || scheduleType === 'SEMI_ANNUALLY' || scheduleType === 'YEARLY_DATE') && (
              <Row className="g-3 mb-2">
                <Col md={6}>
                  <Form.Label className="small fw-semibold">Day of Month</Form.Label>
                  <Form.Select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {scheduleType === 'YEARLY_DATE' && (
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Month</Form.Label>
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
                )}
              </Row>
            )}

            {(scheduleType === 'MONTHLY_RELATIVE' || scheduleType === 'YEARLY_RELATIVE') && (
              <Row className="g-3 mb-2">
                <Col md={4}>
                  <Form.Label className="small fw-semibold">Position</Form.Label>
                  <Form.Select
                    value={relativePos}
                    onChange={(e) => setRelativePos(e.target.value)}
                  >
                    <option value="1-7">First (1st)</option>
                    <option value="8-14">Second (2nd)</option>
                    <option value="15-21">Third (3rd)</option>
                    <option value="22-28">Fourth (4th)</option>
                  </Form.Select>
                </Col>

                <Col md={4}>
                  <Form.Label className="small fw-semibold">Day of Week</Form.Label>
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

                {scheduleType === 'YEARLY_RELATIVE' && (
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Month</Form.Label>
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
                )}
              </Row>
            )}

            <Alert variant="info" className="mb-2 py-2 px-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="fw-semibold">Schedule Summary:</span> {humanReadable}
              </div>
              <code className="bg-white px-2 py-1 border rounded text-dark small">{cronExpression}</code>
            </Alert>

            {/* Live Future Execution Preview */}
            {nextRunsPreview.length > 0 && (
              <div className="mt-2 pt-2 border-top">
                <span className="small fw-bold text-secondary d-block mb-1">Upcoming Next Executions:</span>
                <div className="d-flex gap-2 flex-wrap">
                  {nextRunsPreview.map((runStr, idx) => (
                    <Badge key={idx} bg="light" text="dark" className="border font-normal small">
                      {idx + 1}. {runStr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
