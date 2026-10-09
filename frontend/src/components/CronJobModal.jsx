import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Nav } from 'react-bootstrap';
import { cronToHumanReadable } from '../utils/cronHumanizer';

export const CronJobModal = ({
  show,
  onHide,
  onSubmit,
  jobTypes = [],
  schedulePatterns = [],
  initialValues = null
}) => {
  const [activeTab, setActiveTab] = useState('simple'); // Default to simple builder for end users
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);

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

  // Fallback Raw JSON String (Hidden by default)
  const [payloadJson, setPayloadJson] = useState('{}');

  // Selected pattern master
  const [selectedPatternId, setSelectedPatternId] = useState('');

  // Simple Schedule State
  const [freqType, setFreqType] = useState('EVERY_X_MIN');
  const [minuteInterval, setMinuteInterval] = useState('5');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('1');
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState('1');

  // Cron State
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (show) {
      setErrorMsg(null);
      setShowAdvancedJson(false); // Always default to clean human form view on create & edit

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

        // On edit, keep simple builder active so user sees human schedule
        setActiveTab('simple');
      } else {
        setName('');
        const defaultJobType = jobTypes[0]?.key || 'DAILY_SALES_REPORT';
        setJobType(defaultJobType);
        setTimezone('Asia/Kolkata');
        setFreqType('EVERY_X_MIN');
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
        setPayloadJson('{}');

        if (schedulePatterns.length > 0) {
          setSelectedPatternId(schedulePatterns[0].id);
          setCronExpression(schedulePatterns[0].cronExpression);
          setActiveTab('pattern');
        } else {
          setCronExpression('*/5 * * * *');
          setActiveTab('simple');
        }
      }
    }
  }, [show, initialValues, jobTypes, schedulePatterns]);

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
      let generated = '*/5 * * * *';
      const [hStr, mStr] = selectedTime.split(':');
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
        case 'WEEKLY':
          generated = `${min} ${hour} * * ${selectedDayOfWeek}`;
          break;
        case 'MONTHLY':
          generated = `${min} ${hour} ${selectedDayOfMonth} * *`;
          break;
        default:
          generated = '*/5 * * * *';
      }
      setCronExpression(generated);
    }
  }, [activeTab, freqType, minuteInterval, selectedTime, selectedDayOfWeek, selectedDayOfMonth]);

  // Construct payload object based on selected jobType
  const getConstructedPayload = () => {
    if (showAdvancedJson) {
      try {
        return JSON.parse(payloadJson);
      } catch (e) {
        return {};
      }
    }

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
        try {
          return JSON.parse(payloadJson);
        } catch (e) {
          return {};
        }
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
      setErrorMsg('Please select or specify a valid schedule.');
      return;
    }

    const payload = getConstructedPayload();

    onSubmit({
      name,
      jobType,
      cronExpression: cronExpression.trim(),
      timezone,
      payload
    });
  };

  // Build dynamic factory options so any factory ID (101, 3, 1, etc.) renders cleanly in the dropdown
  const defaultFactories = ['1', '2', '3', '4', '5'];
  const hasCustomFactory = factoryId && !defaultFactories.includes(factoryId);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold">
          {initialValues ? 'Edit Scheduled Job' : 'Schedule a New Job'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Job Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Morning Sales Summary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Action / Task Type</Form.Label>
                <Form.Select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                >
                  {jobTypes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name} ({t.key})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Schedule Picker Box */}
          <div className="border rounded-3 p-3 bg-light mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold text-dark">Schedule Setup</span>
              <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="simple" className="py-1 px-3">
                    Simple Builder
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="pattern" className="py-1 px-3">
                    Pattern Master
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="advanced" className="py-1 px-3">
                    Custom Cron
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            {activeTab === 'pattern' && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Select Schedule Pattern Master</Form.Label>
                <Form.Select
                  value={selectedPatternId}
                  onChange={(e) => handleSelectPattern(e.target.value)}
                >
                  {schedulePatterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.description || cronToHumanReadable(p.cronExpression)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {activeTab === 'simple' && (
              <Row className="g-3 align-items-center mb-3">
                <Col md={4}>
                  <Form.Label className="small text-muted fw-semibold">Frequency</Form.Label>
                  <Form.Select
                    value={freqType}
                    onChange={(e) => setFreqType(e.target.value)}
                  >
                    <option value="EVERY_X_MIN">Every X Minutes</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
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

                {(freqType === 'DAILY' || freqType === 'WEEKLY' || freqType === 'MONTHLY') && (
                  <Col md={4}>
                    <Form.Label className="small text-muted fw-semibold">Time</Form.Label>
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
                          {d}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}
              </Row>
            )}

            {activeTab === 'advanced' && (
              <Form.Group className="mb-2">
                <Form.Label className="small text-muted fw-semibold">Cron Expression (5 fields)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 0 9 * * *"
                  className="font-monospace"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                />
              </Form.Group>
            )}

            <Alert variant="info" className="mb-0 py-2 px-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="fw-semibold">Schedule Summary:</span>{' '}
                <span>{cronToHumanReadable(cronExpression)}</span>
              </div>
              <code className="bg-white px-2 py-1 rounded border text-dark small">{cronExpression}</code>
            </Alert>
          </div>

          {/* User-Friendly Action Parameter Settings */}
          <div className="border rounded-3 p-3 bg-white mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-dark">Task Parameters</h6>
              <Button
                variant="link"
                size="sm"
                className="p-0 text-decoration-none text-secondary"
                onClick={() => setShowAdvancedJson(!showAdvancedJson)}
              >
                {showAdvancedJson ? '← Switch to Form Controls' : 'Advanced JSON Editor →'}
              </Button>
            </div>

            {showAdvancedJson ? (
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Payload (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="font-monospace"
                  value={payloadJson}
                  onChange={(e) => setPayloadJson(e.target.value)}
                />
              </Form.Group>
            ) : (
              <div>
                {jobType === 'DAILY_SALES_REPORT' && (
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Factory / Plant Location</Form.Label>
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
                        <Form.Label className="small fw-semibold">Export Format</Form.Label>
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
                        <Form.Label className="small fw-semibold">Recipient Email Address</Form.Label>
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
                        <Form.Label className="small fw-semibold">Email Template</Form.Label>
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
                        <Form.Label className="small fw-semibold">Security Credential Scope</Form.Label>
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
                        <Form.Label className="small fw-semibold">Log Retention Period</Form.Label>
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
              </div>
            )}
          </div>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Timezone</Form.Label>
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
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialValues ? 'Save Changes' : 'Create Schedule'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
