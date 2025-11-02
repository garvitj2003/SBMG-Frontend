import React, { useState, useEffect } from "react";
import { Plus, Calendar, ChevronDown, X, Upload, Loader2, Edit, Trash2 } from 'lucide-react';
import { schemesAPI } from '../../../services/api';

const VDOSchemesContent = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [activeTab, setActiveTab] = useState('Details');
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        details: '',
        benefits: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitProgress, setSubmitProgress] = useState('');
    
    // Edit scheme state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        eligibility: '',
        benefits: '',
        start_time: '',
        end_time: '',
        active: true
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch schemes data on component mount
    useEffect(() => {
        fetchSchemes();
    }, []);

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await schemesAPI.getSchemes({ skip: 0, limit: 100, active: true });
            setSchemes(response.data);
        } catch (err) {
            console.error('Error fetching schemes:', err);
            setError('Failed to load schemes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Helper function to truncate text
    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Helper function to get scheme image
    const getSchemeImage = (scheme) => {
        if (scheme.media && scheme.media.length > 0) {
            // Use the public media API endpoint
            return `http://139.59.34.99:8000/api/v1/public/media/${encodeURIComponent(scheme.media[0].media_url)}`;
        }
        return '/background.png'; // Fallback to placeholder
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    // Handle form submission with seamless two-step API flow
    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setSubmitProgress('Creating scheme...');

        try {
            // Step 1: Create the scheme
            const schemePayload = {
                name: formData.name,
                description: formData.description,
                eligibility: formData.details || '',
                benefits: formData.benefits || '',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
            };

            const createResponse = await schemesAPI.createScheme(schemePayload);
            const createdScheme = createResponse.data;

            // Step 2: Upload media if file is selected
            if (selectedFile) {
                setSubmitProgress('Uploading media...');
                console.log('Uploading media for scheme ID:', createdScheme.id, 'File:', selectedFile);
                const uploadResponse = await schemesAPI.uploadSchemeMedia(createdScheme.id, selectedFile);
                console.log('Media upload response:', uploadResponse.data);
            }

            // Success - close modal and refresh schemes
            setSubmitProgress('Scheme created successfully!');
            setTimeout(() => {
                setShowModal(false);
                setFormData({ name: '', description: '', details: '', benefits: '' });
                setSelectedFile(null);
                setIsSubmitting(false);
                setSubmitProgress('');
                fetchSchemes(); // Refresh the schemes list
            }, 1000);

        } catch (error) {
            console.error('Error creating scheme:', error);
            setSubmitProgress('');
            setIsSubmitting(false);
            alert('Failed to create scheme. Please try again.');
        }
    };

    // Handle edit button click
    const handleEditClick = (scheme) => {
        setSelectedScheme(scheme);
        setEditFormData({
            name: scheme.name || '',
            description: scheme.description || '',
            eligibility: scheme.eligibility || '',
            benefits: scheme.benefits || '',
            start_time: scheme.start_time || '',
            end_time: scheme.end_time || '',
            active: scheme.active !== undefined ? scheme.active : true
        });
        setShowEditModal(true);
    };

    const handleDeleteScheme = async (schemeId) => {
        if (!schemeId || isDeleting) return;
        const confirmDelete = window.confirm('Are you sure you want to delete this scheme? This action cannot be undone.');
        if (!confirmDelete) {
            return;
        }

        try {
            setIsDeleting(true);
            await schemesAPI.deleteScheme(schemeId);
            setShowDetailsModal(false);
            setSelectedScheme(null);
            await fetchSchemes();
        } catch (error) {
            console.error('Error deleting scheme:', error);
            alert('Failed to delete scheme. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle scheme update
    const handleUpdateScheme = async () => {
        if (!editFormData.name.trim() || !editFormData.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setIsUpdating(true);

        try {
            const updatePayload = {
                name: editFormData.name,
                description: editFormData.description,
                eligibility: editFormData.eligibility,
                benefits: editFormData.benefits,
                start_time: editFormData.start_time,
                end_time: editFormData.end_time,
                active: editFormData.active
            };

            await schemesAPI.updateScheme(selectedScheme.id, updatePayload);
            
            // Close modal and refresh
            setShowEditModal(false);
            setIsUpdating(false);
            fetchSchemes(); // Refresh schemes
        } catch (error) {
            console.error('Error updating scheme:', error);
            setIsUpdating(false);
            alert('Failed to update scheme. Please try again.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
          {/* Header Section */}
     <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
     }}>
         {/* Left side - Dashboard title */}
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            Schemes
          </h1>
        </div>

       
      </div>
      
  {/* Overview Section */}
  <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Overview Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                        <h2 style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: '#111827',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          Overview
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '400',
                            color: '#6b7280'
                          }}>
                            {schemes.length.toString().padStart(2, '0')}
                          </span>
                        </h2>
           
          </div>
          {/* Right side - Add Scheme button */}
        <div>
          <button 
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}>
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Scheme
          </button>
        </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            marginTop: '24px'
          }}>
            <Loader2 style={{ width: '32px', height: '32px', color: '#10b981', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: '12px', color: '#6b7280' }}>Loading schemes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No data available</div>
          </div>
        )}

        {/* Scheme Cards Grid */}
        {!loading && !error && (
        <div style={{
          display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '24px'
        }}>
            {schemes.map((scheme) => (
          <div 
                key={scheme.id}
            onClick={() => {
                  setSelectedScheme(scheme);
              setShowDetailsModal(true);
              setActiveTab('Details');
            }}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s',
                  minHeight: '250px',
                  '&:hover': {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  height: '160px',
                  backgroundImage: `url(${getSchemeImage(scheme)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginBottom: '8px',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: scheme.active ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                fontWeight: '500'
              }}>
                    {scheme.active ? 'Active' : 'Inactive'}
                  </div>
                  {/* Media count indicator if multiple images */}
                  {scheme.media && scheme.media.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      +{scheme.media.length - 1} more
                    </div>
                  )}
                
          </div>
                <div style={{ padding: '16px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                    margin: '0 0 6px 0',
                  lineHeight: '1.4'
                }}>
                  {scheme.name || 'Untitled Scheme'}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                    margin: '0 0 6px 0',
                  lineHeight: '1.5'
                }}>
                  {truncateText(scheme.description, 80)}
                </p>
            
            </div>
          </div>
            ))}
          </div>
        )}

        {/* No Schemes State */}
        {!loading && !error && schemes.length === 0 && (
          <div style={{
            marginTop: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No data available</div>
          </div>
        )}
        </div>

        {/* Add Scheme Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Add scheme
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    color: '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px' }}>
                {/* Image Upload Area */}
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  marginBottom: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: selectedFile ? '#f0f9ff' : 'transparent',
                  borderColor: selectedFile ? '#10b981' : '#d1d5db'
                }}
                onClick={() => document.getElementById('schemeFileInput').click()}>
                  <input
                    id="schemeFileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <Upload style={{ 
                    width: '32px', 
                    height: '32px', 
                    color: selectedFile ? '#10b981' : '#9ca3af', 
                    margin: '0 auto 12px' 
                  }} />
                  <p style={{
                    fontSize: '14px',
                    color: selectedFile ? '#10b981' : '#6b7280',
                    margin: 0
                  }}>
                    {selectedFile ? selectedFile.name : 'Drag and drop your image or click to upload'}
                  </p>
                  {selectedFile && (
                    <p style={{
                      fontSize: '12px',
                      color: '#10b981',
                      margin: '8px 0 0 0'
                    }}>
                      ✓ File selected
                    </p>
                  )}
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Name Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter scheme"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Eligibility Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Eligibility
                    </label>
                    <textarea
                      placeholder="Enter eligibility criteria"
                      value={formData.details}
                      onChange={(e) => setFormData({...formData, details: e.target.value})}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Benefits Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Benefits
                    </label>
                    <textarea
                      placeholder="Benefits"
                      value={formData.benefits}
                      onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {/* Progress indicator */}
                {isSubmitting && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#10b981',
                    fontSize: '14px'
                  }}>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    {submitProgress}
                  </div>
                )}
                
                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                  <button
                    onClick={() => {
                      if (!isSubmitting) {
                        setShowModal(false);
                        setFormData({ name: '', description: '', details: '', benefits: '' });
                        setSelectedFile(null);
                      }
                    }}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSubmitting && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                    {isSubmitting ? 'Creating...' : 'Add Scheme'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheme Details Modal */}
        {showDetailsModal && selectedScheme && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px ',
                paddingBottom: '5px',
                paddingLeft: '20px',
                paddingRight: '20px',
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {selectedScheme?.name || 'Scheme Details'}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleEditClick(selectedScheme)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#10b981',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Edit style={{ width: '16px', height: '16px' }} />
                    Edit Scheme
                  </button>
                  <button
                    onClick={() => handleDeleteScheme(selectedScheme?.id)}
                    disabled={isDeleting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      backgroundColor: isDeleting ? '#fecaca' : 'transparent',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isDeleting ? (
                      <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete Scheme'}
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      color: '#6b7280'
                    }}
                  >
                    <X style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
              }}>
                {['Details', 'Benefits', 'Eligibility'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === tab ? '600' : '400',
                      color: activeTab === tab ? '#111827' : '#6b7280',
                      borderBottom: activeTab === tab ? '2px solid #10b981' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
          

          <divider />
         
                       {/* Tab Content */}
              <div style={{ padding: '24px' }}>
                {activeTab === 'Details' && (
                  <div>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151',
                      margin: '0 0 16px 0'
                    }}>
                      {selectedScheme?.description || 'No description available.'}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      marginTop: '20px'
                    }}>
                    
                    </div>
                  </div>
                )}

                {activeTab === 'Benefits' && (
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedScheme?.benefits || 'No benefits information available.'}
                  </div>
                )}

                {activeTab === 'Eligibility' && (
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedScheme?.eligibility || 'No eligibility information available.'}
                  </div>
                )}

                {activeTab === 'Media' && (
                  <div>
                    {selectedScheme?.media && selectedScheme.media.length > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px'
                      }}>
                        {selectedScheme.media.map((mediaItem, index) => (
                          <div key={index} style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f3f4f6'
                          }}>
                            <img
                              src={`http://139.59.34.99:8000/api/v1/public/media/${encodeURIComponent(mediaItem.media_url)}`}
                              alt={`Scheme media ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                display: 'block',
                                transition: 'opacity 0.3s ease'
                              }}
                              onLoad={(e) => {
                                e.target.style.opacity = '1';
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{
                              display: 'none',
                              width: '100%',
                              height: '150px',
                              backgroundColor: '#f3f4f6',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6b7280',
                              fontSize: '14px',
                              flexDirection: 'column',
                              gap: '8px'
                            }}>
                              <div style={{ fontSize: '24px' }}>📷</div>
                              <div>Failed to load image</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6b7280'
                      }}>
                        <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No media available</p>
                        <p style={{ fontSize: '14px', margin: 0 }}>This scheme doesn't have any images or media files.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Scheme Modal */}
        {showEditModal && selectedScheme && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Edit Scheme
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    color: '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Name Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter scheme name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Description
                    </label>
                    <textarea
                      placeholder="Description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Eligibility Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Eligibility
                    </label>
                    <textarea
                      placeholder="Eligibility criteria"
                      value={editFormData.eligibility}
                      onChange={(e) => setEditFormData({...editFormData, eligibility: e.target.value})}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Benefits Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Benefits
                    </label>
                    <textarea
                      placeholder="Benefits"
                      value={editFormData.benefits}
                      onChange={(e) => setEditFormData({...editFormData, benefits: e.target.value})}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Start Time Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editFormData.start_time ? new Date(editFormData.start_time).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditFormData({...editFormData, start_time: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* End Time Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editFormData.end_time ? new Date(editFormData.end_time).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditFormData({...editFormData, end_time: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Active Status Field */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={editFormData.active}
                        onChange={(e) => setEditFormData({...editFormData, active: e.target.checked})}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      Active
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    opacity: isUpdating ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateScheme}
                  disabled={isUpdating}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isUpdating ? '#9ca3af' : '#10b981',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isUpdating && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                  {isUpdating ? 'Updating...' : 'Update Scheme'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
    );
};

export default VDOSchemesContent;