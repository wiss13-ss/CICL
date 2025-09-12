import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditCaseForm = ({ caseData, onClose, onCaseUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullCaseData, setFullCaseData] = useState(null);
  const [formData, setFormData] = useState({
    ...caseData,
    recommendation: '',
    assessment: ''
  });
  const [checklist, setChecklist] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Fetch the complete case data when the component mounts
  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const response = await axios.get(`http://localhost:5000/api/cases/${caseData.id}`, config);
        setFullCaseData(response.data);
        
        // Initialize form data with recommendation and assessment
        setFormData(prevState => ({
          ...prevState,
          recommendation: response.data.recommendation || '',
          assessment: response.data.assessment || ''
        }));
        
        // Initialize checklist from the fetched data
        if (response.data.checklist) {
          try {
            const checklistData = typeof response.data.checklist === 'string' 
              ? JSON.parse(response.data.checklist) 
              : response.data.checklist;
              
            setChecklist(checklistData.map(item => 
              typeof item === 'string' 
                ? { text: item, completed: false } 
                : item
            ));
          } catch (e) {
            console.error('Error parsing checklist:', e);
            setChecklist([]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching case details');
        console.error('Error fetching case details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCaseDetails();
  }, [caseData.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleChecklistChange = (index, value) => {
    const newChecklist = [...checklist];
    newChecklist[index].text = value;
    setChecklist(newChecklist);
  };

  const toggleChecklistItem = (index) => {
    const newChecklist = [...checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setChecklist(newChecklist);
  };

  const toggleSelectItem = (index) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(item => item !== index));
    } else {
      setSelectedItems([...selectedItems, index]);
    }
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, { text: '', completed: false }]);
  };

  const removeSelectedItems = () => {
    if (selectedItems.length === 0) return;
    
    const newChecklist = checklist.filter((_, index) => !selectedItems.includes(index));
    setChecklist(newChecklist);
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedItems([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
        
      // Create a properly formatted update payload
      const updatedCaseData = {
        firstName: fullCaseData.first_name,
        lastName: fullCaseData.last_name,
        middleName: fullCaseData.middle_name,
        sex: fullCaseData.sex,
        birthdate: fullCaseData.birthdate,
        status: fullCaseData.status,
        religion: fullCaseData.religion,
        address: fullCaseData.address,
        sourceOfReferral: fullCaseData.source_of_referral,
        caseType: fullCaseData.case_type,
        assignedHouseParent: fullCaseData.assigned_house_parent,
        programType: fullCaseData.program_type,
        problemPresented: fullCaseData.problem_presented,
        briefHistory: fullCaseData.brief_history,
        economicSituation: fullCaseData.economic_situation,
        medicalHistory: fullCaseData.medical_history,
        familyBackground: fullCaseData.family_background,
        recommendation: formData.recommendation,
        assessment: formData.assessment,
        checklist: JSON.stringify(checklist)
      };
      
      console.log('Sending data to API:', updatedCaseData);
      
      const response = await axios.put(
        `http://localhost:5000/api/cases/${caseData.id}`, 
        updatedCaseData, 
        config
      );
      
      console.log('Case updated successfully:', response.data);
      
      // Format the response data for the case list
      const updatedCase = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type,
        lastUpdated: formatDate(response.data.last_updated || response.data.updated_at)
      };
      
      if (onCaseUpdated) onCaseUpdated(updatedCase);
      if (onClose) onClose();
    } catch (err) {
      console.error('Detailed error:', err);
      
      // Handle specific error for duplicate name
      if (err.response?.status === 400 && err.response.data?.message?.includes('name already exists')) {
        const errorMessage = err.response.data.message;
        // Display a more user-friendly error message
        setError(`Name uniqueness error: ${errorMessage}`);
      } else {
        setError(err.response?.data?.message || 'Error updating case');
      }
      console.error('Error updating case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDischarge = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('⭐ Starting discharge process...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
        
      // Create a properly formatted update payload with status set to discharge
      const updatedCaseData = {
        firstName: fullCaseData.first_name,
        lastName: fullCaseData.last_name,
        middleName: fullCaseData.middle_name,
        sex: fullCaseData.sex,
        birthdate: fullCaseData.birthdate,
        status: 'discharge', // Using lowercase to match comparison in filter
        religion: fullCaseData.religion,
        address: fullCaseData.address,
        sourceOfReferral: fullCaseData.source_of_referral,
        caseType: fullCaseData.case_type,
        assignedHouseParent: fullCaseData.assigned_house_parent,
        programType: fullCaseData.program_type,
        problemPresented: fullCaseData.problem_presented,
        briefHistory: fullCaseData.brief_history,
        economicSituation: fullCaseData.economic_situation,
        medicalHistory: fullCaseData.medical_history,
        familyBackground: fullCaseData.family_background,
        recommendation: formData.recommendation,
        assessment: formData.assessment,
        checklist: JSON.stringify(checklist),
        lastUpdated: new Date().toISOString() // Add explicit timestamp
      };
      
      console.log('⭐ Sending discharge data to API:', updatedCaseData);
      
      const response = await axios.put(
        `http://localhost:5000/api/cases/${caseData.id}`, 
        updatedCaseData, 
        config
      );
      
      console.log('⭐ Case discharged successfully:', response.data);
      
      // Format the response data for the case list
      const updatedCase = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type,
        status: 'discharge',
        lastUpdated: formatDate(response.data.last_updated || response.data.updated_at)
      };
      
      // Hide modal and return to case list
      setShowDischargeModal(false);
      
      if (onCaseUpdated) onCaseUpdated(updatedCase);
      if (onClose) onClose();
    } catch (err) {
      console.error('Detailed discharge error:', err);
      
      // Handle specific error for duplicate name
      if (err.response?.status === 400 && err.response.data?.message?.includes('name already exists')) {
        const errorMessage = err.response.data.message;
        setError(`Name uniqueness error: ${errorMessage}`);
        setShowDischargeModal(false); // Close the modal and show the error
      } else {
        setError(err.response?.data?.message || 'Error during discharge');
        setShowDischargeModal(false); // Close the modal and show the error
      }
      
      console.error('⭐ Error discharging case:', err);
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

  if (loading && !fullCaseData) {
    return (
      <div className="container-fluid py-4 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#7CB9F3', minHeight: '96vh' }}>
        <div className="text-center">
          <div className="spinner-border text-white" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white mt-3">Loading case details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#7CB9F3', minHeight: '96vh' }}>
      {showDischargeModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="card shadow-sm p-4 mx-2" style={{ maxWidth: '400px' }}>
            <div className="text-center mb-3">
              <i className="fas fa-check-circle text-success" style={{ fontSize: '2rem' }}></i>
              <h5 className="mt-2">Discharge Confirmation</h5>
            </div>
            <p className="text-center">
              Are you sure you want to mark this case for discharge?
              <br />
              <small className="text-muted">This will change the status to "discharge".</small>
            </p>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setShowDischargeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleDischarge}
              >
                Confirm Discharge
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold">EDIT CASE</h2>
        <button 
          className="btn btn-light px-3 py-1" 
          onClick={onClose}
          style={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontWeight: '500',
            fontSize: '14px',
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
        <div className="alert alert-danger mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Name and Program/Services */}
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">CASE DETAILS</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label fw-semibold">Name</label>
                  <div className="form-control form-control-lg bg-light">{formData.name}</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="assignedHouseParent" className="form-label fw-semibold">Assigned House Parent</label>
                  <div className="form-control form-control-lg bg-light">{formData.assignedHouseParent || 'Not assigned'}</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="programType" className="form-label fw-semibold">Program/Services</label>
                  <div className="form-control form-control-lg bg-light">{formData.programType}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">CHECKLIST</h5>
                <div>
                  {isSelectionMode ? (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm me-2"
                        onClick={removeSelectedItems}
                        disabled={selectedItems.length === 0}
                      >
                        <i className="fas fa-trash"></i> Delete ({selectedItems.length})
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-light btn-sm"
                        onClick={toggleSelectionMode}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-outline-light btn-sm me-2"
                        onClick={toggleSelectionMode}
                        style={{ width: '38px', height: '38px', padding: '6px' }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-light btn-sm"
                        onClick={addChecklistItem}
                      >
                        <i className="fas fa-plus"></i> Add Item
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body p-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {checklist.length === 0 ? (
                  <div className="text-center text-muted py-3">
                    No checklist items. Click "Add Item" to create one.
                  </div>
                ) : (
                  checklist.map((item, index) => (
                    <div 
                      key={index} 
                      className={`d-flex align-items-center mb-3 p-2 border-bottom ${selectedItems.includes(index) ? 'bg-light' : ''}`}
                    >
                      {isSelectionMode ? (
                        <div className="form-check me-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedItems.includes(index)}
                            onChange={() => toggleSelectItem(index)}
                            id={`select-${index}`}
                            style={{ width: '20px', height: '20px' }}
                          />
                        </div>
                      ) : (
                        <div className="form-check me-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(index)}
                            id={`check-${index}`}
                            style={{ width: '20px', height: '20px' }}
                          />
                        </div>
                      )}
                      <input
                        type="text"
                        className="form-control"
                        value={item.text}
                        onChange={(e) => handleChecklistChange(index, e.target.value)}
                        placeholder="Checklist item"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recommendation/Plan of Action and Assessment */}
          <div className="col-md-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">RECOMMENDATION/PLAN OF ACTION</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  id="recommendation"
                  name="recommendation"
                  rows="5"
                  value={formData.recommendation || ''}
                  onChange={handleChange}
                  placeholder="Enter recommendation/plan of action"
                ></textarea>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 bg-white mt-4">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">ASSESSMENT</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  id="assessment"
                  name="assessment"
                  rows="5"
                  value={formData.assessment || ''}
                  onChange={handleChange}
                  placeholder="Enter assessment"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-3 mt-3">
          <button 
            type="submit" 
            className="btn btn-primary px-4 py-2"
            style={{ 
              fontWeight: '500',
              fontSize: '16px',
              borderRadius: '4px',
              width: 'auto',
              minWidth: '120px'
            }}
          >
            Save Changes
          </button>
          
          <button 
            type="button" 
            className="btn btn-success px-4 py-2"
            onClick={() => setShowDischargeModal(true)}
            style={{ 
              fontWeight: '500',
              fontSize: '16px',
              borderRadius: '4px',
              width: 'auto',
              minWidth: '120px'
            }}
          >
            Discharge
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCaseForm;
