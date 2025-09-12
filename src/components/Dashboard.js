import React, { useState, useEffect } from 'react';
import { useCases } from '../context/CaseContext';

const Dashboard = () => {
  const { cases, loading, error } = useCases();
  
  // Calculate dashboard statistics
  const activeCasesCount = cases.filter(c => 
    String(c?.status || '').toLowerCase() === 'active' || 
    c?.status === true ||
    c?.isActive === true || 
    c?.status === null || 
    c?.status === undefined
  ).length;
  
  const reintegratedCount = cases.filter(c => 
    String(c?.status || '').toLowerCase() === 'reintegrate'
  ).length;

  const newAdmissionsCount = cases.filter(c => {
    // Assume cases added in the last 30 days are new admissions
    if (!c?.lastUpdated) return false;
    const caseDate = new Date(c.lastUpdated);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return caseDate >= thirtyDaysAgo;
  }).length;

  // Calculate month over month changes
  const calculateMonthlyChanges = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1; // Handle January case
    const currentYear = now.getFullYear();
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear; // Handle January case
    
    // Cases active this month
    const activeCasesThisMonth = cases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === currentMonth && 
             updateDate.getFullYear() === currentYear &&
             (String(c?.status || '').toLowerCase() === 'active' || 
              c?.status === true ||
              c?.isActive === true || 
              c?.status === null || 
              c?.status === undefined);
    }).length;
    
    // Cases active last month
    const activeCasesLastMonth = cases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === lastMonth && 
             updateDate.getFullYear() === lastMonthYear &&
             (String(c?.status || '').toLowerCase() === 'active' || 
              c?.status === true ||
              c?.isActive === true || 
              c?.status === null || 
              c?.status === undefined);
    }).length;
    
    // Calculate active cases percentage change
    const activePercentChange = activeCasesLastMonth > 0 
      ? ((activeCasesThisMonth - activeCasesLastMonth) / activeCasesLastMonth) * 100 
      : 0;
    
    // Reintegrated cases this month
    const reintegratedThisMonth = cases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === currentMonth && 
             updateDate.getFullYear() === currentYear &&
             String(c?.status || '').toLowerCase() === 'reintegrate';
    }).length;
    
    // Reintegrated cases last month
    const reintegratedLastMonth = cases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === lastMonth && 
             updateDate.getFullYear() === lastMonthYear &&
             String(c?.status || '').toLowerCase() === 'reintegrate';
    }).length;
    
    // Calculate reintegrated percentage change
    const reintegratedPercentChange = reintegratedLastMonth > 0 
      ? ((reintegratedThisMonth - reintegratedLastMonth) / reintegratedLastMonth) * 100 
      : 0;
    
    // New admissions this month
    const admissionsThisMonth = cases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === currentMonth && 
             updateDate.getFullYear() === currentYear;
    }).length;
    
    // New admissions last month
    const admissionsLastMonth = cases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === lastMonth && 
             updateDate.getFullYear() === lastMonthYear;
    }).length;
    
    // Calculate new admissions percentage change
    const admissionsPercentChange = admissionsLastMonth > 0 
      ? ((admissionsThisMonth - admissionsLastMonth) / admissionsLastMonth) * 100 
      : 0;
    
    return {
      activePercentChange: Math.round(activePercentChange),
      reintegratedPercentChange: Math.round(reintegratedPercentChange),
      admissionsPercentChange: Math.round(admissionsPercentChange)
    };
  };
  
  const percentChanges = calculateMonthlyChanges();

  return (
    <div className="container-fluid py-4 d-flex flex-column align-items-center" style={{ minHeight: '100vh' }}>
      <h2 className="mb-4 border-bottom pb-3 text-center">Dashboard</h2>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading case data...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="row g-4 justify-content-center w-100">
          {/* Active Cases Card */}
          <div className="col-md-6">
            <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
              <div className="card-body p-4 text-white">
                <h5 className="card-title text-uppercase fw-bold text-center">ACTIVE CASES</h5>
                <div className="d-flex align-items-center justify-content-center my-4">
                  <h1 className="display-1 fw-bold mb-0">{activeCasesCount}</h1>
                </div>
                <div className="mt-2 d-flex align-items-center justify-content-center">
                  {percentChanges.activePercentChange !== 0 && (
                    <>
                      <i className={`fas fa-arrow-${percentChanges.activePercentChange >= 0 ? 'up' : 'down'} me-2 ${percentChanges.activePercentChange < 0 ? 'text-danger' : ''}`}></i>
                      <small>{Math.abs(percentChanges.activePercentChange)}% From Last Month</small>
                    </>
                  )}
                  {percentChanges.activePercentChange === 0 && (
                    <small>No Change From Last Month</small>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Reintegration Card */}
          <div className="col-md-6">
            <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
              <div className="card-body p-4 text-white">
                <h5 className="card-title text-uppercase fw-bold text-center">REINTEGRATION</h5>
                <div className="d-flex align-items-center justify-content-center my-4">
                  <h1 className="display-1 fw-bold mb-0">{reintegratedCount}</h1>
                </div>
                <div className="mt-2 d-flex align-items-center justify-content-center">
                  {percentChanges.reintegratedPercentChange !== 0 && (
                    <>
                      <i className={`fas fa-arrow-${percentChanges.reintegratedPercentChange >= 0 ? 'up' : 'down'} me-2 ${percentChanges.reintegratedPercentChange < 0 ? 'text-danger' : ''}`}></i>
                      <small>{Math.abs(percentChanges.reintegratedPercentChange)}% From Last Month</small>
                    </>
                  )}
                  {percentChanges.reintegratedPercentChange === 0 && (
                    <small>No Change From Last Month</small>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* New Admissions Card */}
          <div className="col-md-6">
            <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
              <div className="card-body p-4 text-white">
                <h5 className="card-title text-uppercase fw-bold text-center">NEW ADMISSIONS</h5>
                <div className="d-flex align-items-center justify-content-center my-4">
                  <h1 className="display-1 fw-bold mb-0">{newAdmissionsCount}</h1>
                </div>
                <div className="mt-2 d-flex align-items-center justify-content-center">
                  {percentChanges.admissionsPercentChange !== 0 && (
                    <>
                      <i className={`fas fa-arrow-${percentChanges.admissionsPercentChange >= 0 ? 'up' : 'down'} me-2 ${percentChanges.admissionsPercentChange < 0 ? 'text-danger' : ''}`}></i>
                      <small>{Math.abs(percentChanges.admissionsPercentChange)}% From Last Month</small>
                    </>
                  )}
                  {percentChanges.admissionsPercentChange === 0 && (
                    <small>No Change From Last Month</small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;