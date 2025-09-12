import React, { useState, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { userProfile, setUserProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    middleName: userProfile?.middleName || '',
    email: userProfile?.email || '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState(userProfile?.profileImage || null);
  const [imageError, setImageError] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Image constraints - updated to 10MB and 1000x1000 pixels
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxDimensions = { width: 1000, height: 1000 }; // Max 1000x1000 pixels

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  // Convert file to base64 string for persistent storage
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      setImageError(`Invalid file type. Please upload ${acceptedFileTypes.map(type => type.split('/')[1]).join(', ')} files only.`);
      return;
    }

    // Check file size
    if (file.size > maxImageSize) {
      setImageError(`File is too large. Maximum size is ${maxImageSize / (1024 * 1024)}MB.`);
      return;
    }

    // Check image dimensions
    const img = new Image();
    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      if (img.width > maxDimensions.width || img.height > maxDimensions.height) {
        setImageError(`Image dimensions must not exceed ${maxDimensions.width}x${maxDimensions.height} pixels.`);
        return;
      }

      try {
        // Convert image to base64 for persistent storage
        const base64Image = await convertToBase64(file);
        setProfileImage(base64Image);
        
        // We'll save the image with the rest of the profile data when form is submitted
        setImageError('');
      } catch (error) {
        console.error("Error converting image:", error);
        setImageError("Failed to process image. Please try again.");
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update user profile with form data and profile image
    const updatedProfile = {
      ...userProfile,
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      email: formData.email,
      profileImage: profileImage
    };
    
    // Update context state
    setUserProfile(updatedProfile);
    
    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#7CB9F3', minHeight: '96vh' }}>
      <h2 className="mb-3 border-bottom pb-2 text-white p-3">Settings</h2>
      <div className="row justify-content-center mx-0">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4" style={{ backgroundColor: '#7CB9F3' }}>
            <div className="card-body p-3">
              <div className="text-center mb-3">
                <div className="avatar-upload mb-2">
                  <div 
                    className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center position-relative" 
                    style={{ width: '100px', height: '100px', cursor: 'pointer', overflow: 'hidden' }}
                    onClick={handleImageClick}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-100 h-100 object-fit-cover" />
                    ) : (
                      <i className="fas fa-user fa-3x text-secondary"></i>
                    )}
                    
                    {isHovering && (
                      <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center" 
                           style={{ 
                             backgroundColor: 'rgba(0,0,0,0.5)', 
                             top: 0, 
                             left: 0 
                           }}>
                        <div className="text-white">
                          <i className="fas fa-camera"></i>
                          <small className="d-block">Click to change</small>
                        </div>
                      </div>
                    )}
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="d-none" 
                      accept={acceptedFileTypes.join(',')}
                      onChange={handleImageChange}
                    />
                  </div>
                  {imageError && <small className="text-danger d-block mt-2">{imageError}</small>}
                </div>
                <h4 className="mb-0 text-white">Profile Settings</h4>
              </div>

              {saveSuccess && (
                <div className="alert alert-success text-center py-2 mb-3" role="alert">
                  Profile saved successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small text-white">First Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-white">Last Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-white">Middle Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-white">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-white">Current Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-white">New Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-white">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 d-flex justify-content-between align-items-center mt-4">
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm px-4"
                    onClick={handleSignOut}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Sign Out
                  </button>

                  <button type="submit" className="btn btn-light btn-sm px-4">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;