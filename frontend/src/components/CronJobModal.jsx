import React from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  name: Yup.string().required('Job Name is required'),
  jobType: Yup.string().required('Job Type is required'),
  cronExpression: Yup.string()
    .required('Cron Expression is required')
    .matches(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/[0-9]+)\s+(\*|([0-9]|1[0-9]|2[0-3])|\*\/[0-9]+)\s+(\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/[0-9]+)\s+(\*|([1-9]|1[0-2])|\*\/[0-9]+)\s+(\*|([0-6])|\*\/[0-9]+)$/, 'Invalid cron expression format (5 fields e.g., * * * * *)'),
  timezone: Yup.string().required('Timezone is required'),
  payloadJson: Yup.string().test('is-json', 'Must be valid JSON format', (value) => {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  })
});

const CRON_PRESETS = [
  { label: 'Every minute (* * * * *)', value: '* * * * *' },
  { label: 'Every 5 minutes (*/5 * * * *)', value: '*/5 * * * *' },
  { label: 'Every hour (0 * * * *)', value: '0 * * * *' },
  { label: 'Daily at 9:00 AM (0 9 * * *)', value: '0 9 * * *' },
  { label: 'Every Monday at midnight (0 0 * * 1)', value: '0 0 * * 1' },
  { label: 'First day of month (0 0 1 * *)', value: '0 0 1 * *' }
];

export const CronJobModal = ({
  show,
  onHide,
  onSubmit,
  jobTypes = [],
  initialValues = null
}) => {
  const formik = useFormik({
    initialValues: {
      name: initialValues?.name || '',
      jobType: initialValues?.jobType || (jobTypes[0]?.key || 'DAILY_SALES_REPORT'),
      cronExpression: initialValues?.cronExpression || '0 9 * * *',
      timezone: initialValues?.timezone || 'Asia/Kolkata',
      payloadJson: initialValues?.payload ? JSON.stringify(initialValues.payload, null, 2) : '{\n  "factoryId": 3\n}'
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const payload = values.payloadJson ? JSON.parse(values.payloadJson) : {};
      onSubmit({
        name: values.name,
        jobType: values.jobType,
        cronExpression: values.cronExpression,
        timezone: values.timezone,
        payload
      });
    }
  });

  return (
    <Modal show={show} onHide={onHide} centered size="lg" contentClassName="modal-content-dark">
      <Modal.Header closeButton closeVariant="white" className="modal-header-dark">
        <Modal.Title className="h5 font-semibold">
          {initialValues ? 'Edit Scheduled Job' : 'Create New Scheduled Job'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit}>
        <Modal.Body className="p-4">
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Job Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="e.g. Daily Sales Report"
                  className="form-control-dark"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.name && Boolean(formik.errors.name)}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Predefined Job Handler</Form.Label>
                <Form.Select
                  name="jobType"
                  className="form-select-dark"
                  value={formik.values.jobType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.jobType && Boolean(formik.errors.jobType)}
                >
                  {jobTypes.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.key} ({type.name})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted small">Executes pre-registered safe handler.</Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Timezone</Form.Label>
                <Form.Control
                  type="text"
                  name="timezone"
                  placeholder="Asia/Kolkata"
                  className="form-control-dark"
                  value={formik.values.timezone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.timezone && Boolean(formik.errors.timezone)}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.timezone}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="small text-muted fw-semibold mb-0">Cron Expression</Form.Label>
                  <Form.Select
                    size="sm"
                    className="form-select-dark py-0 px-2"
                    style={{ width: 'auto', fontSize: '0.8rem' }}
                    onChange={(e) => {
                      if (e.target.value) formik.setFieldValue('cronExpression', e.target.value);
                    }}
                  >
                    <option value="">Quick Presets...</option>
                    {CRON_PRESETS.map((p, i) => (
                      <option key={i} value={p.value}>{p.label}</option>
                    ))}
                  </Form.Select>
                </div>
                <Form.Control
                  type="text"
                  name="cronExpression"
                  placeholder="0 9 * * *"
                  className="form-control-dark font-monospace"
                  value={formik.values.cronExpression}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.cronExpression && Boolean(formik.errors.cronExpression)}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.cronExpression}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="small text-muted fw-semibold">Job Payload (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="payloadJson"
                  className="form-control-dark font-monospace"
                  value={formik.values.payloadJson}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.payloadJson && Boolean(formik.errors.payloadJson)}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.payloadJson}</Form.Control.Feedback>
                <Form.Text className="text-muted small">Parameters passed to the predefined job handler.</Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="modal-footer-dark">
          <Button variant="outline-secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary-gradient">
            {initialValues ? 'Save Changes' : 'Create Schedule'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
