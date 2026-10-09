import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Clock, Server, Activity } from 'lucide-react';

export const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar expand="lg" className="app-navbar py-3 mb-4">
        <Container fluid className="px-4">
          <Navbar.Brand href="#home" className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3 bg-indigo-600 bg-opacity-20 d-flex align-items-center justify-content-center" style={{ background: 'rgba(99, 102, 241, 0.2)' }}>
              <Clock size={24} color="#818cf8" />
            </div>
            <span className="brand-text">Cron Manager</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-3">
              <span className="text-muted small d-flex align-items-center gap-1">
                <Server size={16} /> PostgreSQL + BullMQ + Redis
              </span>
              <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 px-3 py-2 rounded-pill d-flex align-items-center gap-1">
                <Activity size={14} /> System Operational
              </span>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="px-4 flex-grow-1 pb-5">
        {children}
      </Container>

      <footer className="py-3 border-top border-secondary border-opacity-25 mt-auto text-center text-muted small">
        <Container>
          Dynamic Cron & Scheduled Job Management System • Built with React & BullMQ Architecture
        </Container>
      </footer>
    </div>
  );
};
