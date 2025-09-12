import React, { useState } from 'react';
import axios from 'axios';
import CaseDetailsForm from './CaseDetailsForm';

// Add custom styling to hide focus indicators
const customSelectStyle = {
  outline: 'none',
  boxShadow: 'none',
  cursor: 'pointer'
};

const customInputStyle = {
  outline: 'none'
};

const AddCaseForm = ({ onClose, onCaseAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    sex: '',
    birthdate: '',
    status: '',
    religion: '',
    address: '',
    sourceOfReferral: '',
    caseType: '',
    assignedHouseParent: ''
  });
  
  const [showNextForm, setShowNextForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'caseType') {
      console.log('Program/Services selected:', value);
    }
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.sex || !formData.birthdate) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Check for name uniqueness before proceeding to the next form
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // Perform a check to see if the name already exists
      const response = await axios.get(`http://localhost:5000/api/cases?checkName=true&firstName=${formData.firstName}&lastName=${formData.lastName}`);
      
      if (response.data && response.data.exists) {
        setError('This name already exists in the system. Please use a different name or modify the existing case.');
        setLoading(false);
        return;
      }
      
      console.log('Form data saved for next step:', formData);
      setShowNextForm(true);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.message?.includes('name already exists')) {
        setError('This name is already registered in the system. Please provide a unique name identifier for this case.');
      } else {
        setError('An error occurred during validation. Please try again.');
      }
      console.error('Error validating name uniqueness:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (completeData) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      // Use axios defaults instead of passing config
      // axios already has the token in its defaults from CaseManagement
      const caseData = {
        ...formData,
        ...completeData,
        programType: formData.caseType, // Main field for program type
        caseType: formData.caseType,    // Keep for backward compatibility
        program_type: formData.caseType, // Also send with underscore format for API
        status: 'active', // Explicitly set active status
        lastUpdated: new Date().toISOString() // Add current timestamp
      };
      
      console.log('Submitting case data:', caseData);
      const response = await axios.post('http://localhost:5000/api/cases', caseData);
      
      console.log('Case added successfully:', response.data);
      
      // Format the response data for the case list
      const now = new Date();
      const newCase = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type || formData.caseType, // Use the actual program_type or fallback to caseType
        status: 'active', // Explicitly include status
        lastUpdated: formatDate(response.data.last_updated || response.data.created_at || now),
        timestamp: now.getTime() // Add timestamp for notification tracking
      };
      
      if (onCaseAdded) {
        console.log('Calling onCaseAdded with new case:', newCase);
        onCaseAdded(newCase);
      }
      if (onClose) onClose();
      
    } catch (err) {
      console.error('Error adding case:', err);
      
      // Handle specific error for duplicate name
      if (err.response?.status === 400 && err.response.data?.message?.includes('name already exists')) {
        setError('The name provided already exists in our system. Each case must have a unique name identifier. Please revise the name or update the existing case record.');
        
        // If on details page, go back to the first page to let user change the name
        if (showNextForm) {
          setShowNextForm(false);
        }
      } else {
        setError(err.response?.data?.message || 'Error adding case');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  function calculateAge(birthdate) {
    if (!birthdate) return '';
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function formatDate(date) {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  if (showNextForm) {
    return (
      <CaseDetailsForm 
        initialData={formData} 
        onBack={() => setShowNextForm(false)}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#7CB9F3', minHeight: '96vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold">ADD NEW CASE</h2>
        <button 
          className="btn btn-light px-3 py-1" 
          onClick={onClose}
          style={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontWeight: '500',
            fontSize: '14px',
            borderRadius: '4px',
            width: 'auto',
            minWidth: '80px'
          }}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-circle me-2" style={{ fontSize: '1.25rem' }}></i>
            <div>
              <strong>Validation Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleNext}>
        <div className="row">
          {/* Personal Information */}
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">PERSONAL INFORMATION</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label htmlFor="firstName" className="form-label fw-semibold">Child's First Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    style={customInputStyle}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="lastName" className="form-label fw-semibold">Child's Last Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    style={customInputStyle}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="middleName" className="form-label fw-semibold">Child's Middle Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Enter middle name"
                    style={customInputStyle}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="sex" className="form-label fw-semibold">Sex</label>
                  <select
                    className="form-select form-select-lg"
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    style={customSelectStyle}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="birthdate" className="form-label fw-semibold">Birthdate</label>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    id="birthdate"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    style={customInputStyle}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="status" className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select form-select-lg"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={customSelectStyle}
                  >
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="religion" className="form-label fw-semibold">Religion</label>
                  <select
                    className="form-select form-select-lg"
                    id="religion"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    style={customSelectStyle}
                  >
                    <option value="">Select religion</option>
                    <option value="Roman Catholic">Roman Catholic</option>
                    <option value="Protestant">Protestant</option>
                    <option value="Islam">Islam</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="address" className="form-label fw-semibold">Address</label>
                  <textarea
                    className="form-control"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter complete address"
                    style={customInputStyle}
                    required
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="sourceOfReferral" className="form-label fw-semibold">Source of Referral</label>
                  <select
                    className="form-select form-select-lg"
                    id="sourceOfReferral"
                    name="sourceOfReferral"
                    value={formData.sourceOfReferral}
                    onChange={handleChange}
                    style={customSelectStyle}
                    required
                  >
                    <option value="">Select source</option>
                    <option value="Police">Police</option>
                    <option value="DSWD">DSWD</option>
                    <option value="Court">Court</option>
                    <option value="School">School</option>
                    <option value="Family">Family</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="caseType" className="form-label fw-semibold">Program/Services</label>
                  <select
                    className="form-select form-select-lg"
                    id="caseType"
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleChange}
                    style={customSelectStyle}
                    required
                  >
                    <option value="">Select program/service</option>
                    <option value="Blessed Rosalie Rendu">Blessed Rosalie Rendu</option>
                    <option value="Blessed Margaret Rutan">Blessed Margaret Rutan</option>
                    <option value="Blessed Martha Wiecka">Blessed Martha Wiecka</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="assignedHouseParent" className="form-label fw-semibold">Assigned House Parent</label>
                  <select
                    className="form-select form-select-lg"
                    id="assignedHouseParent"
                    name="assignedHouseParent"
                    value={formData.assignedHouseParent}
                    onChange={handleChange}
                    style={customSelectStyle}
                    required
                  >
                    <option value="">Select house parent</option>
                    <option value="Parent 1">Parent 1</option>
                    <option value="Parent 2">Parent 2</option>
                    <option value="Parent 3">Parent 3</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Educational Attainment & Sacramental Record */}
          <div className="col-md-8 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">EDUCATIONAL ATTAINMENT</h5>
              </div>
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th width="20%">LEVEL</th>
                        <th width="30%">NAME OF SCHOOL</th>
                        <th width="30%">SCHOOL ADDRESS</th>
                        <th width="20%">YEAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="align-middle fw-semibold">Elementary</td>
                        <td><input type="text" className="form-control" placeholder="School name" /></td>
                        <td><input type="text" className="form-control" placeholder="School address" /></td>
                        <td><input type="text" className="form-control" placeholder="Year" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">High School</td>
                        <td><input type="text" className="form-control" placeholder="School name" /></td>
                        <td><input type="text" className="form-control" placeholder="School address" /></td>
                        <td><input type="text" className="form-control" placeholder="Year" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Senior High School</td>
                        <td><input type="text" className="form-control" placeholder="School name" /></td>
                        <td><input type="text" className="form-control" placeholder="School address" /></td>
                        <td><input type="text" className="form-control" placeholder="Year" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Vocational Course</td>
                        <td><input type="text" className="form-control" placeholder="School name" /></td>
                        <td><input type="text" className="form-control" placeholder="School address" /></td>
                        <td><input type="text" className="form-control" placeholder="Year" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">College</td>
                        <td><input type="text" className="form-control" placeholder="School name" /></td>
                        <td><input type="text" className="form-control" placeholder="School address" /></td>
                        <td><input type="text" className="form-control" placeholder="Year" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Others</td>
                        <td><input type="text" className="form-control" placeholder="School name" /></td>
                        <td><input type="text" className="form-control" placeholder="School address" /></td>
                        <td><input type="text" className="form-control" placeholder="Year" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Sacramental Record */}
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">SACRAMENTAL RECORD</h5>
              </div>
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th width="25%">SACRAMENT</th>
                        <th width="35%">DATE RECEIVED</th>
                        <th width="40%">PLACE/PARISH</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="align-middle fw-semibold">Baptism</td>
                        <td>
                          <input type="date" className="form-control" />
                        </td>
                        <td><input type="text" className="form-control" placeholder="Enter place/parish" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">First Communion</td>
                        <td>
                          <input type="date" className="form-control" />
                        </td>
                        <td><input type="text" className="form-control" placeholder="Enter place/parish" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Confirmation</td>
                        <td>
                          <input type="date" className="form-control" />
                        </td>
                        <td><input type="text" className="form-control" placeholder="Enter place/parish" /></td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Others</td>
                        <td>
                          <input type="date" className="form-control" />
                        </td>
                        <td><input type="text" className="form-control" placeholder="Enter place/parish" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="d-flex justify-content-end mt-3">
          <button 
            type="submit"
            className="btn btn-primary px-5 py-2" 
            style={{
              borderRadius: '4px',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Validating...
              </>
            ) : (
              <>
                Next <i className="fas fa-arrow-right ms-2"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCaseForm;
