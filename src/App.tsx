import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { HourSubmission } from './pages/HourSubmission';
import { Overview } from './pages/Overview';
import { Projects } from './pages/Projects';
import { Approvals } from './pages/Approvals';
import { People } from './pages/People';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <Layout>
            <Overview />
          </Layout>
        } />
        <Route path="/hours" element={
          <Layout>
            <HourSubmission />
          </Layout>
        } />
        <Route path="/projects" element={
          <Layout>
            <Projects />
          </Layout>
        } />
        <Route path="/approvals" element={
          <Layout>
            <Approvals />
          </Layout>
        } />
        <Route path="/people" element={
          <Layout>
            <People />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;