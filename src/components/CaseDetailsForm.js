import React, { useState } from 'react';

const CaseDetailsForm = ({ initialData, onClose, onSubmit, onBack, loading, error }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    agencies: [
      { name: '', addressDateDuration: '', servicesReceived: '' },
      { name: '', addressDateDuration: '', servicesReceived: '' },
      { name: '', addressDateDuration: '', servicesReceived: '' }
    ],
    problemPresented: '',
    briefHistory: '',
    economicSituation: '',
    medicalHistory: '',
    familyBackground: ''
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAgencyChange = (index, field, value) => {
    const updatedAgencies = [...formData.agencies];
    updatedAgencies[index] = {
      ...updatedAgencies[index],
      [field]: value
    };
    
    setFormData(prevState => ({
      ...prevState,
      agencies: updatedAgencies
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    console.log('Complete form submitted:', formData);
    // Call the onSubmit prop to pass data back to parent
    if (onSubmit) onSubmit(formData);
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#7CB9F3', minHeight: '96vh' }}>
      {showConfirmModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '8px' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-3 d-flex justify-content-center">
                  <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <i className="fas fa-check text-white" style={{ fontSize: '24px' }}></i>
                  </div>
                </div>
                <h5 className="modal-title fw-bold mb-3">Add New Case Confirmation</h5>
                <p className="mb-2">Are you sure you want to add this new case record?</p>
                <p className="text-muted small mb-4">This will create a new case file in the system.</p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-2 px-4" 
                    onClick={handleCancel}
                    style={{ minWidth: '120px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success px-4" 
                    onClick={handleConfirm}
                    style={{ minWidth: '200px' }}
                  >
                    Add Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold">CASE DETAILS</h2>
        <div className="progress" style={{ height: '10px', width: '200px' }}>
          <div 
            className="progress-bar bg-success" 
            role="progressbar" 
            style={{ width: '100%' }}
            aria-valuenow={100} 
            aria-valuemin="0" 
            aria-valuemax="100"
          ></div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Name of Agencies/Persons */}
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">NAME OF AGENCIES/PERSONS</h5>
              </div>
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th width="30%">Name</th>
                        <th width="35%">Address/Date/Duration</th>
                        <th width="35%">Services Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.agencies.map((agency, index) => (
                        <tr key={index}>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder={`${index + 1}.`}
                              value={agency.name}
                              onChange={(e) => handleAgencyChange(index, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter address/date/duration"
                              value={agency.addressDateDuration}
                              onChange={(e) => handleAgencyChange(index, 'addressDateDuration', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter services received"
                              value={agency.servicesReceived}
                              onChange={(e) => handleAgencyChange(index, 'servicesReceived', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Presented and Brief History */}
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">PROBLEM PRESENTED</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  name="problemPresented"
                  value={formData.problemPresented}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Describe the problem presented"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">BRIEF HISTORY OF THE PROBLEM</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  name="briefHistory"
                  value={formData.briefHistory}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Provide a brief history of the problem"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Economic Situation */}
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">ECONOMIC SITUATION</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  name="economicSituation"
                  value={formData.economicSituation}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe the economic situation"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Medical History/Health Status */}
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">MEDICAL HISTORY/HEALTH STATUS</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Describe the medical history and health status"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Family Background */}
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">FAMILY BACKGROUND</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  name="familyBackground"
                  value={formData.familyBackground}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Describe the family background"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <div className="d-flex justify-content-between mt-3">
          <button 
            type="button"
            className="btn btn-outline-primary px-5 py-2" 
            onClick={onBack}
            style={{
              borderRadius: '4px',  
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            <i className="fas fa-arrow-left me-2"></i> Previous
          </button>
          
          <button 
            type="submit"
            className="btn btn-success px-5 py-2" 
            style={{
              borderRadius: '4px',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Submit Case <i className="fas fa-check ms-2"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseDetailsForm;