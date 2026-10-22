import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Nav, Badge } from 'react-bootstrap';
import { cronToHumanReadable } from '../utils/cronHumanizer';
import cronParser from 'cron-parser';
import { Clock, Calendar, Sparkles, Check, AlertCircle, Sliders, Code } from 'lucide-react';

export const CronJobModal = ({
  show,
  onHide,
  onSubmit,
  jobTypes = [],
  schedulePatterns = [],
  initialValues = null,
  preselectedPattern = null
}) => {
  const [activeTab, setActiveTab] = useState('simple'); // 'simple', 'pattern', or 'advanced'
  const [payloadMode, setPayloadMode] = useState('form'); // 'form' or 'json'

  // General Form Fields
  const [name, setName] = useState('');
  const [jobType, setJobType] = useState('DAILY_SALES_REPORT');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Friendly Parameter Fields for Predefined Handlers
  const [factoryId, setFactoryId] = useState('1');
  const [reportFormat, setReportFormat] = useState('PDF');
  const [recipientEmail, setRecipientEmail] = useState('admin@company.com');
  const [emailTemplate, setEmailTemplate] = useState('weekly_digest');
  const [securityScope, setSecurityScope] = useState('ALL_KEYS');
  const [retentionDays, setRetentionDays] = useState('30');

  // Advanced Raw JSON String
  const [payloadJson, setPayloadJson] = useState('{}');
  const [jsonError, setJsonError] = useState(null);

  // Selected pattern master
  const [selectedPatternId, setSelectedPatternId] = useState('');

  // Simple Schedule State
  const [freqType, setFreqType] = useState('DAILY');
  const [minuteInterval, setMinuteInterval] = useState('5');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('1');
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState('1');

  // Cron State
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [errorMsg, setErrorMsg] = useState(null);

  const getDefaultPayloadForType = (type) => {
    switch (type) {
      case 'DAILY_SALES_REPORT':
        return { factoryId: 1, reportFormat: 'PDF' };
      case 'EMAIL_NOTIFICATION':
        return { recipient: 'admin@company.com', template: 'weekly_digest' };
      case 'ENCRYPTION_ROTATION':
        return { scope: 'ALL_KEYS' };
      case 'LOG_CLEANUP':
        return { retentionDays: 30 };
      default:
        return {};
    }
  };

  useEffect(() => {
    if (show) {
      setErrorMsg(null);
      setJsonError(null);
      setPayloadMode('form');

      if (initialValues) {
        setName(initialValues.name || '');
        const currentJobType = initialValues.jobType || (jobTypes[0]?.key || 'DAILY_SALES_REPORT');
        setJobType(currentJobType);
        setTimezone(initialValues.timezone || 'Asia/Kolkata');
        setCronExpression(initialValues.cronExpression || '0 9 * * *');

        const payload = initialValues.payload || {};
        if (payload.factoryId !== undefined) setFactoryId(String(payload.factoryId));
        if (payload.reportFormat) setReportFormat(payload.reportFormat);
        if (payload.recipient) setRecipientEmail(payload.recipient);
        if (payload.template) setEmailTemplate(payload.template);
        if (payload.scope) setSecurityScope(payload.scope);
        if (payload.retentionDays !== undefined) setRetentionDays(String(payload.retentionDays));

        setPayloadJson(JSON.stringify(payload, null, 2));
        setActiveTab('simple');
      } else if (preselectedPattern) {
        setName(`Job - ${preselectedPattern.name}`);
        const defaultJobType = jobTypes[0]?.key || 'DAILY_SALES_REPORT';
        setJobType(defaultJobType);
        setTimezone('Asia/Kolkata');
        setSelectedPatternId(preselectedPattern.id);
        setCronExpression(preselectedPattern.cronExpression);
        setActiveTab('pattern');

        setFactoryId('1');
        setReportFormat('PDF');
        setRecipientEmail('admin@company.com');
        setEmailTemplate('weekly_digest');
        setSecurityScope('ALL_KEYS');
        setRetentionDays('30');
        setPayloadJson(JSON.stringify(getDefaultPayloadForType(defaultJobType), null, 2));
      } else {
        setName('');
        const defaultJobType = jobTypes[0]?.key || 'DAILY_SALES_REPORT';
        setJobType(defaultJobType);
        setTimezone('Asia/Kolkata');
        setFreqType('DAILY');
        setMinuteInterval('5');
        setSelectedTime('09:00');
        setSelectedDayOfWeek('1');
        setSelectedDayOfMonth('1');

        setFactoryId('1');
        setReportFormat('PDF');
        setRecipientEmail('admin@company.com');
        setEmailTemplate('weekly_digest');
        setSecurityScope('ALL_KEYS');
        setRetentionDays('30');
        setPayloadJson(JSON.stringify(getDefaultPayloadForType(defaultJobType), null, 2));

        if (schedulePatterns.length > 0) {
          setSelectedPatternId(schedulePatterns[0].id);
        }
        setCronExpression('0 9 * * *');
        setActiveTab('simple');
      }
    }
  }, [show, initialValues, preselectedPattern, jobTypes, schedulePatterns]);

  const handleSelectPattern = (patternId) => {
    setSelectedPatternId(patternId);
    const found = schedulePatterns.find((p) => p.id === patternId);
    if (found) {
      setCronExpression(found.cronExpression);
    }
  };

  useEffect(() => {
    if (activeTab === 'simple') {
      let generated = '0 9 * * *';
      const [hStr, mStr] = (selectedTime || '09:00').split(':');
      const hour = parseInt(hStr, 10) || 0;
      const min = parseInt(mStr, 10) || 0;

      switch (freqType) {
        case 'EVERY_X_MIN':
          generated = `*/${minuteInterval} * * * *`;
          break;
        case 'HOURLY':
          generated = `${min} * * * *`;
          break;
        case 'DAILY':
          generated = `${min} ${hour} * * *`;
          break;
        case 'WEEKDAYS':
          generated = `${min} ${hour} * * 1-5`;
          break;
        case 'WEEKLY':
          generated = `${min} ${hour} * * ${selectedDayOfWeek}`;
          break;
        case 'MONTHLY':
          generated = `${min} ${hour} ${selectedDayOfMonth} * *`;
          break;
        default:
          generated = '0 9 * * *';
      }
      setCronExpression(generated);
    }
  }, [activeTab, freqType, minuteInterval, selectedTime, selectedDayOfWeek, selectedDayOfMonth]);

  const nextRuns = useMemo(() => {
    try {
      const interval = cronParser.parseExpression(cronExpression, { tz: timezone || 'Asia/Kolkata' });
      const runs = [];
      for (let i = 0; i < 2; i++) {
        runs.push(interval.next().toDate().toLocaleString());
      }
      return runs;
    } catch (e) {
      return [];
    }
  }, [cronExpression, timezone]);

  const assembledFormPayload = useMemo(() => {
    switch (jobType) {
      case 'DAILY_SALES_REPORT':
        return { factoryId: parseInt(factoryId, 10) || 1, reportFormat };
      case 'EMAIL_NOTIFICATION':
        return { recipient: recipientEmail, template: emailTemplate };
      case 'ENCRYPTION_ROTATION':
        return { scope: securityScope };
      case 'LOG_CLEANUP':
        return { retentionDays: parseInt(retentionDays, 10) || 30 };
      default:
        return {};
    }
  }, [jobType, factoryId, reportFormat, recipientEmail, emailTemplate, securityScope, retentionDays]);

  const handleSwitchToJSON = () => {
    setPayloadJson(JSON.stringify(assembledFormPayload, null, 2));
    setJsonError(null);
    setPayloadMode('json');
  };

  const handleSwitchToForm = () => {
    try {
      const parsed = JSON.parse(payloadJson);
      if (parsed.factoryId !== undefined) setFactoryId(String(parsed.factoryId));
      if (parsed.reportFormat) setReportFormat(parsed.reportFormat);
      if (parsed.recipient) setRecipientEmail(parsed.recipient);
      if (parsed.template) setEmailTemplate(parsed.template);
      if (parsed.scope) setSecurityScope(parsed.scope);
      if (parsed.retentionDays !== undefined) setRetentionDays(String(parsed.retentionDays));
      setPayloadMode('form');
    } catch (e) {
      setJsonError('Cannot switch: Current JSON has syntax errors.');
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payloadJson);
      setPayloadJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a job name.');
      return;
    }

    if (!cronExpression.trim()) {
      setErrorMsg('Please specify a recurrence schedule.');
      return;
    }

    let finalPayload = {};
    if (payloadMode === 'json') {
      try {
        finalPayload = JSON.parse(payloadJson);
      } catch (err) {
        setErrorMsg('Invalid JSON Payload: Check syntax before submitting.');
        return;
      }
    } else {
      finalPayload = assembledFormPayload;
    }

    onSubmit({
      name: name.trim(),
      jobType,
      cronExpression: cronExpression.trim(),
      timezone,
      payload: finalPayload
    });
  };

  const defaultFactories = ['1', '2', '3', '4', '5'];
  const hasCustomFactory = factoryId && !defaultFactories.includes(factoryId);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="py-2.5 px-3">
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-1.5">
          <Calendar size={17} className="text-primary" />
          <span>{initialValues ? 'Edit Scheduled Job' : 'Schedule a New Job'}</span>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-3">
          {errorMsg && <Alert variant="danger" className="py-1 px-2.5 mb-2 small">{errorMsg}</Alert>}

          {/* Row 1: General Info */}
          <Row className="g-2 mb-2.5">
            <Col md={7}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Job Name</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="e.g. Morning Sales Compile"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Task Type</Form.Label>
                <Form.Select
                  size="sm"
                  value={jobType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setJobType(newType);
                    setPayloadJson(JSON.stringify(getDefaultPayloadForType(newType), null, 2));
                  }}
                >
                  {jobTypes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Row 2: Schedule Section (Compact Box) */}
          <div className="p-2.5 bg-light rounded border mb-2.5">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold text-dark small" style={{ fontSize: '0.78rem' }}>
                Recurrence Schedule
              </span>
              <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="simple" className="py-0.5 px-2" style={{ fontSize: '0.75rem' }}>
                    Visual Builder
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="pattern" className="py-0.5 px-2" style={{ fontSize: '0.75rem' }}>
                    Pattern Template
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="advanced" className="py-0.5 px-2" style={{ fontSize: '0.75rem' }}>
                    Raw Cron
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            {/* Pattern Template Mode */}
            {activeTab === 'pattern' && (
              <Form.Group className="mb-2">
                <Form.Select
                  size="sm"
                  value={selectedPatternId}
                  onChange={(e) => handleSelectPattern(e.target.value)}
                >
                  {schedulePatterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.scheduleType}) — {p.cronExpression}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {/* Visual Builder Mode */}
            {activeTab === 'simple' && (
              <Row className="g-2 align-items-center mb-1">
                <Col md={4}>
                  <Form.Select
                    size="sm"
                    value={freqType}
                    onChange={(e) => setFreqType(e.target.value)}
                  >
                    <option value="EVERY_X_MIN">Every X Minutes</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKDAYS">Weekdays (Mon-Fri)</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </Form.Select>
                </Col>

                {freqType === 'EVERY_X_MIN' && (
                  <Col md={4}>
                    <Form.Select
                      size="sm"
                      value={minuteInterval}
                      onChange={(e) => setMinuteInterval(e.target.value)}
                    >
                      <option value="1">Every 1 min</option>
                      <option value="5">Every 5 mins</option>
                      <option value="10">Every 10 mins</option>
                      <option value="15">Every 15 mins</option>
                      <option value="30">Every 30 mins</option>
                    </Form.Select>
                  </Col>
                )}

                {(freqType === 'DAILY' || freqType === 'WEEKDAYS' || freqType === 'WEEKLY' || freqType === 'MONTHLY') && (
                  <Col md={4}>
                    <Form.Control
                      size="sm"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    />
                  </Col>
                )}

                {freqType === 'WEEKLY' && (
                  <Col md={4}>
                    <Form.Select
                      size="sm"
                      value={selectedDayOfWeek}
                      onChange={(e) => setSelectedDayOfWeek(e.target.value)}
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
                )}

                {freqType === 'MONTHLY' && (
                  <Col md={4}>
                    <Form.Select
                      size="sm"
                      value={selectedDayOfMonth}
                      onChange={(e) => setSelectedDayOfMonth(e.target.value)}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Day {d} of month
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}
              </Row>
            )}

            {/* Custom Cron Mode */}
            {activeTab === 'advanced' && (
              <Form.Group className="mb-1">
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="e.g. 0 9 * * *"
                  className="font-monospace"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                />
              </Form.Group>
            )}

            {/* Live Summary Bar */}
            <div className="d-flex align-items-center justify-content-between p-1.5 px-2 bg-white rounded border mt-2">
              <div className="d-flex align-items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Schedule:</span>
                <span className="text-primary fw-medium small" style={{ fontSize: '0.78rem' }}>
                  {cronToHumanReadable(cronExpression)}
                </span>
              </div>
              <code className="cron-code">{cronExpression}</code>
            </div>
          </div>

          {/* Row 3: Task Payload (Compact Box) */}
          <div className="p-2.5 bg-white rounded border mb-2">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold text-dark small" style={{ fontSize: '0.78rem' }}>
                Task Payload & Parameters
              </span>
              <div className="d-flex align-items-center gap-1">
                <Button
                  variant={payloadMode === 'form' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                  onClick={handleSwitchToForm}
                >
                  Form Mode
                </Button>
                <Button
                  variant={payloadMode === 'json' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                  onClick={handleSwitchToJSON}
                >
                  Raw JSON
                </Button>
              </div>
            </div>

            {payloadMode === 'form' ? (
              <div>
                {jobType === 'DAILY_SALES_REPORT' && (
                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Label className="small text-muted" style={{ fontSize: '0.75rem' }}>Plant Location</Form.Label>
                      <Form.Select
                        size="sm"
                        value={factoryId}
                        onChange={(e) => setFactoryId(e.target.value)}
                      >
                        <option value="1">Main Plant #1 (HQ)</option>
                        <option value="2">Manufacturing Hub #2</option>
                        <option value="3">Assembly Unit #3</option>
                        <option value="4">Logistics Center #4</option>
                        <option value="5">Plant Unit #5</option>
                        {hasCustomFactory && <option value={factoryId}>Factory #{factoryId}</option>}
                      </Form.Select>
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small text-muted" style={{ fontSize: '0.75rem' }}>Format</Form.Label>
                      <Form.Select
                        size="sm"
                        value={reportFormat}
                        onChange={(e) => setReportFormat(e.target.value)}
                      >
                        <option value="PDF">PDF Summary Document</option>
                        <option value="EXCEL">Excel Spreadsheet</option>
                        <option value="JSON">Raw JSON Data</option>
                      </Form.Select>
                    </Col>
                  </Row>
                )}

                {jobType === 'EMAIL_NOTIFICATION' && (
                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Label className="small text-muted" style={{ fontSize: '0.75rem' }}>Recipient</Form.Label>
                      <Form.Control
                        size="sm"
                        type="email"
                        placeholder="manager@company.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small text-muted" style={{ fontSize: '0.75rem' }}>Template</Form.Label>
                      <Form.Select
                        size="sm"
                        value={emailTemplate}
                        onChange={(e) => setEmailTemplate(e.target.value)}
                      >
                        <option value="weekly_digest">Weekly Digest</option>
                        <option value="daily_summary">Daily Summary</option>
                        <option value="system_alert">System Alert</option>
                      </Form.Select>
                    </Col>
                  </Row>
                )}

                {jobType === 'ENCRYPTION_ROTATION' && (
                  <Row className="g-2">
                    <Col md={12}>
                      <Form.Label className="small text-muted" style={{ fontSize: '0.75rem' }}>Key Scope</Form.Label>
                      <Form.Select
                        size="sm"
                        value={securityScope}
                        onChange={(e) => setSecurityScope(e.target.value)}
                      >
                        <option value="ALL_KEYS">All Application Encryption Keys</option>
                        <option value="API_TOKENS">API Service Tokens Only</option>
                        <option value="DATABASE">Database Credentials Only</option>
                      </Form.Select>
                    </Col>
                  </Row>
                )}

                {jobType === 'LOG_CLEANUP' && (
                  <Row className="g-2">
                    <Col md={12}>
                      <Form.Label className="small text-muted" style={{ fontSize: '0.75rem' }}>Retention</Form.Label>
                      <Form.Select
                        size="sm"
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(e.target.value)}
                      >
                        <option value="14">Older than 14 Days</option>
                        <option value="30">Older than 30 Days (Standard)</option>
                        <option value="60">Older than 60 Days</option>
                        <option value="90">Older than 90 Days</option>
                      </Form.Select>
                    </Col>
                  </Row>
                )}
              </div>
            ) : (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Payload JSON</span>
                  <Button variant="link" size="sm" className="p-0 text-decoration-none" style={{ fontSize: '0.72rem' }} onClick={handleFormatJson}>
                    Format JSON
                  </Button>
                </div>
                <Form.Control
                  size="sm"
                  as="textarea"
                  rows={3}
                  className="font-monospace"
                  style={{ fontSize: '0.75rem' }}
                  value={payloadJson}
                  onChange={(e) => setPayloadJson(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Timezone (Inline) */}
          <Row className="g-2 align-items-center">
            <Col sm={3}>
              <Form.Label className="small text-muted mb-0" style={{ fontSize: '0.75rem' }}>Timezone</Form.Label>
            </Col>
            <Col sm={9}>
              <Form.Control
                size="sm"
                type="text"
                placeholder="Asia/Kolkata"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="py-2 px-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {initialValues ? 'Save Changes' : 'Schedule Job'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
