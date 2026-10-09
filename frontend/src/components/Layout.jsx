import React from 'react';
import { Navbar, Container, Nav, Badge } from 'react-bootstrap';
import { Clock, Server, CheckCircle2 } from 'lucide-react';

export const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="border-bottom sticky-top py-2 shadow-sm">
        <Container fluid className="px-4">
          <Navbar.Brand href="#home" className="d-flex align-items-center gap-2 fw-bold text-primary fs-5">
            <Clock size={22} className="text-primary" />
            <span>Cron Manager</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-3">
              <span className="text-secondary small d-flex align-items-center gap-1">
                <Server size={14} /> PostgreSQL + Redis + BullMQ
              </span>
              <Badge bg="success" className="px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1 fw-normal">
                <CheckCircle2 size={12} /> System Operational
              </Badge>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="px-4 flex-grow-1 py-4">
        {children}
      </Container>

      <footer className="py-3 border-top bg-white mt-auto text-center text-muted small">
        <Container>
          Dynamic Scheduled Job Management Engine • Powered by BullMQ & React Bootstrap
        </Container>
      </footer>
    </div>
  );
};
