import React from 'react';
import { Navbar, Container, Nav, Badge } from 'react-bootstrap';
import { Clock, Server, CheckCircle2, Cpu } from 'lucide-react';

export const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="app-navbar py-2.5 sticky-top">
        <Container fluid className="px-4">
          <Navbar.Brand href="#home" className="d-flex align-items-center gap-2 text-decoration-none">
            <div className="p-1.5 bg-primary bg-opacity-10 text-primary rounded-2 d-flex align-items-center justify-content-center">
              <Clock size={20} className="text-primary" />
            </div>
            <span className="brand-text">Cron Manager</span>
            <Badge bg="light" text="dark" className="border ms-1 fw-medium font-monospace small px-2 py-1">
              v1.2 Enterprise
            </Badge>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-3">
              <div className="d-none d-md-flex align-items-center gap-2 text-muted small border-end pe-3">
                <Cpu size={14} className="text-secondary" />
                <span>BullMQ & Redis Engine</span>
              </div>
              <div className="d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-success bg-opacity-10 text-success small fw-medium">
                <span className="d-inline-block rounded-circle bg-success" style={{ width: '7px', height: '7px' }}></span>
                <span>System Operational</span>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="px-4 flex-grow-1 py-4">
        {children}
      </Container>

      <footer className="py-3.5 border-top bg-white mt-auto text-center text-muted small">
        <Container className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <span>Enterprise Dynamic Cron / Scheduled Job Management System</span>
          <span className="font-monospace text-secondary">PostgreSQL • Redis • Express • React</span>
        </Container>
      </footer>
    </div>
  );
};
