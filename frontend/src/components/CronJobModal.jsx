import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Nav, Badge, Tab } from 'react-bootstrap';
import { cronToHumanReadable } from '../utils/cronHumanizer';
import cronParser from 'cron-parser';
import { Clock, Calendar, Sparkles, CheckCircle2, Code, Sliders, Check, AlertCircle, RefreshCw } from 'lucide-react';

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
  // For DAILY_SALES_REPORT
  const [factoryId, setFactoryId] = useState('1');
  const [reportFormat, setReportFormat] = useState('PDF');

  // For EMAIL_NOTIFICATION
  const [recipientEmail, setRecipientEmail] = useState('admin@company.com');
  const [emailTemplate, setEmailTemplate] = useState('weekly_digest');

  // For ENCRYPTION_ROTATION
  const [securityScope, setSecurityScope] = useState('ALL_KEYS');

  // For LOG_CLEANUP
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

  // Generate default payload template for a given job type
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

        // Populate friendly parameter form from existing payload
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

  // Handle pattern selection
  const handleSelectPattern = (patternId) => {
    setSelectedPatternId(patternId);
    const found = schedulePatterns.find((p) => p.id === patternId);
    if (found) {
      setCronExpression(found.cronExpression);
    }
  };

  // Generate cron expression dynamically in Simple Builder mode
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

  // Next run dates preview
  const nextRuns = useMemo(() => {
    try {
      const interval = cronParser.parseExpression(cronExpression, { tz: timezone || 'Asia/Kolkata' });
      const runs = [];
      for (let i = 0; i < 3; i++) {
        runs.push(interval.next().toDate().toLocaleString());
      }
      return runs;
    } catch (e) {
      return [];
    }
  }, [cronExpression, timezone]);

  // Construct assembled payload from form
  const assembledFormPayload = useMemo(() => {
    switch (jobType) {
      case 'DAILY_SALES_REPORT':
        return {
          factoryId: parseInt(factoryId, 10) || 1,
          reportFormat
        };
      case 'EMAIL_NOTIFICATION':
        return {
          recipient: recipientEmail,
          template: emailTemplate
        };
      case 'ENCRYPTION_ROTATION':
        return {
          scope: securityScope
        };
      case 'LOG_CLEANUP':
        return {
          retentionDays: parseInt(retentionDays, 10) || 30
        };
      default:
        return {};
    }
  }, [jobType, factoryId, reportFormat, recipientEmail, emailTemplate, securityScope, retentionDays]);

  // Keep payloadJson synced with form when switching to JSON
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
      setJsonError('Cannot switch to form: Current JSON is invalid. Please fix syntax errors first.');
    }
  };

  // Format / Beautify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payloadJson);
      setPayloadJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  // Reset to default sample JSON
  const handleResetSampleJson = () => {
    const sample = getDefaultPayloadForType(jobType);
    setPayloadJson(JSON.stringify(sample, null, 2));
    setJsonError(null);
  };

  // Validate JSON as user types
  const handleJsonChange = (val) => {
    setPayloadJson(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a scheduled job name.');
      return;
    }

    if (!cronExpression.trim()) {
      setErrorMsg('Please select or specify a valid recurrence schedule.');
      return;
    }

    let finalPayload = {};
    if (payloadMode === 'json') {
      try {
        finalPayload = JSON.parse(payloadJson);
      } catch (err) {
        setErrorMsg('Invalid JSON Payload: Please correct syntax errors before submitting.');
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
      <Modal.Header closeButton className="pb-3">
        <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
          <Calendar size={20} className="text-primary" />
          <span>{initialValues ? 'Edit Scheduled Job' : 'Schedule a New Job'}</span>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {errorMsg && <Alert variant="danger" className="py-2.5 small">{errorMsg}</Alert>}

          {/* Section 1: General Info */}
          <div className="mb-4">
            <h6 className="fw-bold text-dark small text-uppercase tracking-wider mb-2.5">
              1. General Details
            </h6>
            <Row className="g-3">
              <Col md={7}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Job Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Daily Operations Summary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Action / Task Type</Form.Label>
                  <Form.Select
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
          </div>

          {/* Section 2: Recurrence Schedule */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2.5">
              <h6 className="fw-bold text-dark small text-uppercase tracking-wider mb-0">
                2. Recurrence Schedule
              </h6>
              <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="simple" className="py-1 px-3 small">
                    Visual Builder
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="pattern" className="py-1 px-3 small">
                    Pattern Template
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="advanced" className="py-1 px-3 small">
                    Raw Cron
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            <div className="border rounded-3 p-3 bg-light">
              {/* Pattern Template Mode */}
              {activeTab === 'pattern' && (
                <div className="mb-2">
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold text-secondary">Choose Saved Pattern Master</Form.Label>
                    <Form.Select
                      value={selectedPatternId}
                      onChange={(e) => handleSelectPattern(e.target.value)}
                    >
                      {schedulePatterns.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.scheduleType})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              )}

              {/* Visual Builder Mode */}
              {activeTab === 'simple' && (
                <Row className="g-3 align-items-center mb-2">
                  <Col md={4}>
                    <Form.Label className="small text-muted fw-semibold">Frequency</Form.Label>
                    <Form.Select
                      value={freqType}
                      onChange={(e) => setFreqType(e.target.value)}
                    >
                      <option value="EVERY_X_MIN">Every X Minutes</option>
                      <option value="HOURLY">Hourly</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKDAYS">Every Weekday (Mon-Fri)</option>
                      <option value="WEEKLY">Weekly (Specific Day)</option>
                      <option value="MONTHLY">Monthly (Specific Date)</option>
                    </Form.Select>
                  </Col>

                  {freqType === 'EVERY_X_MIN' && (
                    <Col md={4}>
                      <Form.Label className="small text-muted fw-semibold">Interval</Form.Label>
                      <Form.Select
                        value={minuteInterval}
                        onChange={(e) => setMinuteInterval(e.target.value)}
                      >
                        <option value="1">Every 1 minute</option>
                        <option value="5">Every 5 minutes</option>
                        <option value="10">Every 10 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                      </Form.Select>
                    </Col>
                  )}

                  {(freqType === 'DAILY' || freqType === 'WEEKDAYS' || freqType === 'WEEKLY' || freqType === 'MONTHLY') && (
                    <Col md={4}>
                      <Form.Label className="small text-muted fw-semibold">Execution Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      />
                    </Col>
                  )}

                  {freqType === 'WEEKLY' && (
                    <Col md={4}>
                      <Form.Label className="small text-muted fw-semibold">Day of Week</Form.Label>
                      <Form.Select
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
                      <Form.Label className="small text-muted fw-semibold">Day of Month</Form.Label>
                      <Form.Select
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
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted fw-semibold">Cron Expression (Standard 5 fields)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. 0 9 * * *"
                    className="font-monospace"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                  />
                </Form.Group>
              )}

              {/* Schedule Summary Banner */}
              <div className="p-2.5 bg-white rounded border d-flex flex-column gap-1.5 mt-2">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" />
                    <span className="small text-muted fw-semibold">Schedule:</span>
                    <span className="text-primary fw-medium small">{cronToHumanReadable(cronExpression)}</span>
                  </div>
                  <code className="bg-light px-2 py-0.5 rounded border text-dark small font-monospace">
                    {cronExpression}
                  </code>
                </div>
                {nextRuns.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center gap-2 text-muted small border-top pt-1 mt-1" style={{ fontSize: '0.75rem' }}>
                    <div className="d-flex align-items-center gap-1">
                      <Clock size={11} />
                      <span>Next Run: <strong className="text-dark">{nextRuns[0]}</strong></span>
                    </div>
                    {nextRuns[1] && (
                      <span className="text-secondary">• Then: {nextRuns[1]}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Task Payload & Parameters */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2.5">
              <h6 className="fw-bold text-dark small text-uppercase tracking-wider mb-0">
                3. Task Parameters & Payload
              </h6>
              <div className="d-flex align-items-center gap-1">
                <Button
                  variant={payloadMode === 'form' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="py-0.5 px-2.5 small d-flex align-items-center gap-1"
                  onClick={handleSwitchToForm}
                >
                  <Sliders size={12} /> Structured Form
                </Button>
                <Button
                  variant={payloadMode === 'json' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="py-0.5 px-2.5 small d-flex align-items-center gap-1"
                  onClick={handleSwitchToJSON}
                >
                  <Code size={12} /> Advanced JSON
                </Button>
              </div>
            </div>

            <div className="border rounded-3 p-3 bg-white">
              {payloadMode === 'form' ? (
                <div>
                  {jobType === 'DAILY_SALES_REPORT' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">Factory / Plant Location</Form.Label>
                          <Form.Select
                            value={factoryId}
                            onChange={(e) => setFactoryId(e.target.value)}
                          >
                            <option value="1">Main Plant #1 (HQ)</option>
                            <option value="2">Manufacturing Hub #2</option>
                            <option value="3">Assembly Unit #3</option>
                            <option value="4">Logistics Center #4</option>
                            <option value="5">Plant Unit #5</option>
                            {hasCustomFactory && (
                              <option value={factoryId}>Factory #{factoryId}</option>
                            )}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">Export Format</Form.Label>
                          <Form.Select
                            value={reportFormat}
                            onChange={(e) => setReportFormat(e.target.value)}
                          >
                            <option value="PDF">PDF Summary Document</option>
                            <option value="EXCEL">Excel Spreadsheet</option>
                            <option value="JSON">Raw JSON Data</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {jobType === 'EMAIL_NOTIFICATION' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">Recipient Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="e.g. manager@company.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">Email Template</Form.Label>
                          <Form.Select
                            value={emailTemplate}
                            onChange={(e) => setEmailTemplate(e.target.value)}
                          >
                            <option value="weekly_digest">Weekly Digest Template</option>
                            <option value="daily_summary">Daily Summary Template</option>
                            <option value="system_alert">System Alert Template</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {jobType === 'ENCRYPTION_ROTATION' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">Security Credential Scope</Form.Label>
                          <Form.Select
                            value={securityScope}
                            onChange={(e) => setSecurityScope(e.target.value)}
                          >
                            <option value="ALL_KEYS">All Application Encryption Keys</option>
                            <option value="API_TOKENS">API Service Tokens Only</option>
                            <option value="DATABASE">Database Credentials Only</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {jobType === 'LOG_CLEANUP' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">Log Retention Period</Form.Label>
                          <Form.Select
                            value={retentionDays}
                            onChange={(e) => setRetentionDays(e.target.value)}
                          >
                            <option value="14">Older than 14 Days</option>
                            <option value="30">Older than 30 Days (Standard)</option>
                            <option value="60">Older than 60 Days</option>
                            <option value="90">Older than 90 Days</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {/* Assembled payload preview footer */}
                  <div className="mt-3 pt-2.5 border-top d-flex align-items-center justify-content-between">
                    <span className="small text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                      Assembled Payload: {JSON.stringify(assembledFormPayload)}
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small fw-normal">
                      <Check size={11} className="me-1 inline" /> Valid Schema
                    </span>
                  </div>
                </div>
              ) : (
                /* Advanced JSON Mode */
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="small text-muted fw-semibold">Custom Payload JSON</span>
                      {jsonError ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 small fw-normal">
                          <AlertCircle size={11} className="me-1 inline" /> Invalid Syntax
                        </span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small fw-normal">
                          <Check size={11} className="me-1 inline" /> Valid JSON
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                      <Button variant="outline-secondary" size="sm" className="py-0.5 px-2 small" onClick={handleFormatJson}>
                        Format JSON
                      </Button>
                      <Button variant="outline-secondary" size="sm" className="py-0.5 px-2 small" onClick={handleResetSampleJson}>
                        Load Template
                      </Button>
                    </div>
                  </div>

                  <Form.Control
                    as="textarea"
                    rows={4}
                    className={`font-monospace small ${jsonError ? 'is-invalid' : ''}`}
                    value={payloadJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                  />

                  {jsonError && (
                    <div className="invalid-feedback d-block small mt-1">
                      {jsonError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Execution Timezone</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Asia/Kolkata"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialValues ? 'Save Changes' : 'Schedule Job'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
