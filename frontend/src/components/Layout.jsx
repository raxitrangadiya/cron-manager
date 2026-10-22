import React from 'react';
import { Navbar, Container, Nav, Badge } from 'react-bootstrap';
import { Clock, Server, CheckCircle2, Cpu } from 'lucide-react';

export const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="app-navbar sticky-top">
        <Container fluid className="px-3">
          <Navbar.Brand href="#home" className="d-flex align-items-center gap-2 text-decoration-none py-0">
            <div className="p-1 bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center">
              <Clock size={18} className="text-primary" />
            </div>
            <span className="brand-text">Cron Manager</span>
            <Badge bg="light" text="dark" className="border fw-normal font-monospace ms-1" style={{ fontSize: '0.68rem', padding: '0.2rem 0.4rem' }}>
              v1.2
            </Badge>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" className="py-0 px-1 border-0" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-2.5 py-1 py-lg-0">
              <div className="d-none d-md-flex align-items-center gap-1.5 text-muted small pe-2 border-end" style={{ fontSize: '0.78rem' }}>
                <Cpu size={13} className="text-secondary" />
                <span>BullMQ & Redis Engine</span>
              </div>
              <div className="d-flex align-items-center gap-1.5 px-2 py-0.5 rounded-pill bg-success bg-opacity-10 text-success fw-medium" style={{ fontSize: '0.75rem' }}>
                <span className="d-inline-block rounded-circle bg-success" style={{ width: '6px', height: '6px' }}></span>
                <span>Operational</span>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="px-3 flex-grow-1 py-3">
        {children}
      </Container>

      <footer className="py-2 border-top bg-white mt-auto text-center text-muted" style={{ fontSize: '0.75rem' }}>
        <Container fluid className="px-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-1">
          <span>Enterprise Dynamic Cron / Scheduled Job Management System</span>
          <span className="font-monospace text-secondary">PostgreSQL • Redis • Express • React</span>
        </Container>
      </footer>
    </div>
  );
};
