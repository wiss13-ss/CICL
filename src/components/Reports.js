import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';
import { useCases } from '../context/CaseContext';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
  const { cases, loading, error } = useCases();
  
  // Process case data for reports
  const processReportData = () => {
    if (!cases || cases.length === 0) {
      return {
        activeCases: {
          newAdmissions: 0,
          Reintegration: 0
        },
        performanceByMonth: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        reintegrationByMonth: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        programDistribution: {
          'Blessed Rosalie Rendu': 0,
          'Blessed Margaret Rutan': 0,
          'Blessed Martha Wiecka': 0
        }
      };
    }

    // Count active cases
    const newAdmissionsCount = cases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return updateDate >= thirtyDaysAgo && 
             (String(c?.status || '').toLowerCase() === 'active' || 
              c?.status === true ||
              c?.isActive === true || 
              c?.status === null || 
              c?.status === undefined);
    }).length;

    const reintegrationCount = cases.filter(c => 
      String(c?.status || '').toLowerCase() === 'reintegrate'
    ).length;

    // Group data by months
    const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const admissionsByMonth = new Array(12).fill(0);
    const reintegrationsByMonth = new Array(12).fill(0);

    cases.forEach(c => {
      if (c?.lastUpdated) {
        const updateDate = new Date(c.lastUpdated);
        const month = updateDate.getMonth();
        
        // Count as admission if it's active
        if (String(c?.status || '').toLowerCase() === 'active' || 
            c?.status === true ||
            c?.isActive === true || 
            c?.status === null || 
            c?.status === undefined) {
          admissionsByMonth[month]++;
        }
        
        // Count as reintegration if it's marked as reintegrate
        if (String(c?.status || '').toLowerCase() === 'reintegrate') {
          reintegrationsByMonth[month]++;
        }
      }
    });

    // Program distribution
    const programCounts = {
      'Blessed Rosalie Rendu': 0,
      'Blessed Margaret Rutan': 0,
      'Blessed Martha Wiecka': 0
    };

    cases.forEach(c => {
      if (c?.programType) {
        if (c.programType.includes('Rosalie')) {
          programCounts['Blessed Rosalie Rendu']++;
        } else if (c.programType.includes('Margaret')) {
          programCounts['Blessed Margaret Rutan']++;
        } else if (c.programType.includes('Martha')) {
          programCounts['Blessed Martha Wiecka']++;
        }
      }
    });

    return {
      activeCases: {
        newAdmissions: newAdmissionsCount,
        Reintegration: reintegrationCount
      },
      performanceByMonth: {
        labels: monthLabels,
        data: admissionsByMonth
      },
      reintegrationByMonth: {
        labels: monthLabels,
        data: reintegrationsByMonth
      },
      programDistribution: programCounts
    };
  };

  // State to store case data
  const [caseData, setCaseData] = useState(processReportData());

  // Update report data when cases change
  useEffect(() => {
    setCaseData(processReportData());
  }, [cases]);

  // Active Cases Donut Chart Data
  const activeCasesData = {
    labels: ['New Admissions', 'Reintegration'],
    datasets: [
      {
        data: [caseData.activeCases.newAdmissions, caseData.activeCases.Reintegration],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderWidth: 0,
        cutout: '60%'
      },
    ],
  };

  // Admission Data (previously Performance Analysis)
  const admissionData = {
    labels: caseData.performanceByMonth.labels,
    datasets: [
      {
        label: 'Monthly Admissions',
        data: caseData.performanceByMonth.data,
        backgroundColor: '#0096FF',
        borderRadius: 4,
        barThickness: 30,
      },
    ],
  };

  // Reintegration Data - Monthly view
  const reintegrationData = {
    labels: caseData.reintegrationByMonth.labels,
    datasets: [
      {
        label: 'Monthly Reintegrations',
        data: caseData.reintegrationByMonth.data,
        backgroundColor: '#81C784',
        borderRadius: 4,
        barThickness: 30,
      },
    ],
  };

  // Program Distribution Chart Data
  const programData = {
    labels: Object.keys(caseData.programDistribution),
    datasets: [
      {
        data: Object.values(caseData.programDistribution),
        backgroundColor: [
          '#FF6384', // Pink for Rosalie
          '#36A2EB', // Blue for Margaret
          '#FFCE56'  // Yellow for Martha
        ],
        borderWidth: 1
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <h2 className="mb-4 border-bottom pb-3">REPORTS</h2>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <h2 className="mb-4 border-bottom pb-3">REPORTS</h2>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 border-bottom pb-3">REPORTS</h2>
      
      <div className="row g-4">
        {/* Active Cases Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
            <div className="card-body p-4 text-white">
              <h5 className="card-title text-uppercase fw-bold">Active Cases</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Doughnut 
                  data={activeCasesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: 'white',
                          font: {
                            size: 12
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Admission Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
            <div className="card-body p-4 text-white">
              <h5 className="card-title text-uppercase fw-bold">Admission</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={admissionData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Reintegration Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
            <div className="card-body p-4 text-white">
              <h5 className="card-title text-uppercase fw-bold">Reintegration</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={reintegrationData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Program/Services Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
            <div className="card-body p-4 text-white">
              <h5 className="card-title text-uppercase fw-bold">Program/Services</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Pie data={programData} options={pieOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;