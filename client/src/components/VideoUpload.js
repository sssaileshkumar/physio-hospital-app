// client/src/components/VideoUpload.js - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VideoUpload = ({ onVideoUploaded }) => {
  const [uploadType, setUploadType] = useState('individual'); // 'individual' or 'module'
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  
  // Form data for video upload
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [] // For individual videos
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Multiple video upload for modules
  const [multipleVideos, setMultipleVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    fetchPatients();
    fetchModules();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/videos/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.get('/modules/all');
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSingleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMultipleVideos(files);
  };

  const handlePatientSelect = (patientId) => {
    const updatedAssigned = formData.assignedTo.includes(patientId)
      ? formData.assignedTo.filter(id => id !== patientId)
      : [...formData.assignedTo, patientId];
    
    setFormData({
      ...formData,
      assignedTo: updatedAssigned
    });
  };

  // Upload single video (for individual videos)
  const uploadSingleVideo = async (e) => {
    e.preventDefault();
    
    if (!videoFile) {
      setMessage('Please select a video file');
      return;
    }

    if (uploadType === 'individual' && formData.assignedTo.length === 0) {
      setMessage('Please assign the video to at least one patient');
      return;
    }

    if (uploadType === 'module' && !selectedModule) {
      setMessage('Please select a module');
      return;
    }

    setLoading(true);
    setMessage('');
    setUploadProgress(0);

    const uploadData = new FormData();
    uploadData.append('video', videoFile);
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    
    if (uploadType === 'individual') {
      uploadData.append('assignedTo', JSON.stringify(formData.assignedTo));
    }

    try {
      // Upload video first
      const videoResponse = await axios.post('/videos/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      // If uploading to module, add video to module
      if (uploadType === 'module' && selectedModule) {
        await axios.post(`/modules/${selectedModule}/add-videos`, {
          videoIds: [videoResponse.data._id]
        });
      }
      
      setMessage('Video uploaded successfully!');
      resetForm();
      onVideoUploaded && onVideoUploaded();
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading video');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Upload multiple videos to module
  const uploadMultipleVideos = async (e) => {
    e.preventDefault();
    
    if (multipleVideos.length === 0) {
      setMessage('Please select at least one video file');
      return;
    }

    if (!selectedModule) {
      setMessage('Please select a module for multiple video upload');
      return;
    }

    setLoading(true);
    setMessage('');
    setCurrentVideoIndex(0);

    const uploadedVideoIds = [];

    try {
      // Upload videos one by one
      for (let i = 0; i < multipleVideos.length; i++) {
        const videoFile = multipleVideos[i];
        setCurrentVideoIndex(i + 1);
        setUploadProgress(0);

        const uploadData = new FormData();
        uploadData.append('video', videoFile);
        uploadData.append('title', `${formData.title} - Part ${i + 1}` || `Video ${i + 1}`);
        uploadData.append('description', formData.description || `Part ${i + 1} of the series`);
        uploadData.append('assignedTo', JSON.stringify([])); // No individual assignment for module videos

        const videoResponse = await axios.post('/videos/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        uploadedVideoIds.push(videoResponse.data._id);
      }

      // Add all videos to the module
      if (uploadedVideoIds.length > 0) {
        await axios.post(`/modules/${selectedModule}/add-videos`, {
          videoIds: uploadedVideoIds
        });
      }

      setMessage(`Successfully uploaded ${multipleVideos.length} videos to the module!`);
      resetForm();
      onVideoUploaded && onVideoUploaded();

    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading videos');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setCurrentVideoIndex(0);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', assignedTo: [] });
    setVideoFile(null);
    setMultipleVideos([]);
    setSelectedModule('');
    document.getElementById('video-upload-form')?.reset();
    document.getElementById('multiple-video-upload-form')?.reset();
  };

  const getSelectedModuleName = () => {
    const module = modules.find(m => m._id === selectedModule);
    return module ? module.name : '';
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      
      <div style={{ 
        marginBottom: '30px', 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '12px',
        border: '2px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
          📹 Choose Upload Method
        </h3>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            type="button"
            onClick={() => setUploadType('individual')}
            style={{
              padding: '15px 25px',
              backgroundColor: uploadType === 'individual' ? '#007bff' : 'white',
              color: uploadType === 'individual' ? 'white' : '#333',
              border: '2px solid #007bff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <span>🎥</span>
            Individual Video
          </button>
          
          <button
            type="button"
            onClick={() => setUploadType('module')}
            style={{
              padding: '15px 25px',
              backgroundColor: uploadType === 'module' ? '#28a745' : 'white',
              color: uploadType === 'module' ? 'white' : '#333',
              border: '2px solid #28a745',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <span>📚</span>
            Module Videos
          </button>
        </div>
        
        <div style={{ marginTop: '15px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', fontSize: '14px', color: '#666' }}>
          {uploadType === 'individual' ? (
            <><strong>📝 Individual Video:</strong> Upload a single video and assign it directly to specific patients</>
          ) : (
            <><strong>📚 Module Videos:</strong> Upload one or multiple videos directly into a training module</>
          )}
        </div>
      </div>

     
      {message && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: message.includes('success') || message.includes('Successfully') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('success') || message.includes('Successfully') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          color: message.includes('success') || message.includes('Successfully') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

   
      {loading && (
        <div style={{ 
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {uploadType === 'module' && multipleVideos.length > 1 
                ? `Uploading video ${currentVideoIndex} of ${multipleVideos.length}...`
                : 'Uploading video...'
              }
            </span>
            <span style={{ fontSize: '14px', color: '#666' }}>{uploadProgress}%</span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

     
      {uploadType === 'individual' && (
        <form id="video-upload-form" onSubmit={uploadSingleVideo}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '25px', 
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
              🎥 Upload Individual Video
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Video Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Shoulder Flexibility Exercise"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Select Video File *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleSingleFileChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the exercise, instructions, and benefits..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                Assign to Patients *
              </label>
              <div style={{ 
                border: '2px solid #e9ecef', 
                borderRadius: '6px', 
                padding: '15px',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#f8f9fa'
              }}>
                {patients.map(patient => (
                  <div key={patient._id} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px', borderRadius: '4px', backgroundColor: 'white' }}>
                      <input
                        type="checkbox"
                        checked={formData.assignedTo.includes(patient._id)}
                        onChange={() => handlePatientSelect(patient._id)}
                        style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{patient.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{patient.email}</div>
                      </div>
                    </label>
                  </div>
                ))}
                {patients.length === 0 && (
                  <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                    No patients available
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? '⏳ Uploading...' : '🚀 Upload Individual Video'}
            </button>
          </div>
        </form>
      )}

      // MODULE VIDEO UPLOAD FORM 
      {uploadType === 'module' && (
        <div>
        //Module Selection
          <div style={{ 
            backgroundColor: 'white', 
            padding: '25px', 
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
              📚 Select Target Module
            </h3>

            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                Choose Module *
              </label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Select a module to add videos --</option>
                {modules.map(module => (
                  <option key={module._id} value={module._id}>
                    {module.category.toUpperCase()} - {module.name} ({module.videos.length} videos)
                  </option>
                ))}
              </select>
              
              {selectedModule && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '12px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  ✅ Selected: <strong>{getSelectedModuleName()}</strong>
                </div>
              )}
            </div>

            {modules.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                color: '#856404'
              }}>
                <p style={{ margin: 0 }}>
                  📝 <strong>No modules available.</strong><br/>
                  Create a module first in the Module Manager to upload videos to it.
                </p>
              </div>
            )}
          </div>

          // Video Upload Options
          {selectedModule && (
            <>
              // Single Video to Module
              <form id="video-upload-form" onSubmit={uploadSingleVideo} style={{ marginBottom: '30px' }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '25px', 
                  borderRadius: '12px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
                    🎥 Upload Single Video to Module
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Video Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Exercise 1 - Warm Up"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Select Video File *
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleSingleFileChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe this specific exercise..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '15px',
                      backgroundColor: loading ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '⏳ Uploading...' : '📚 Add Video to Module'}
                  </button>
                </div>
              </form>

              <form id="multiple-video-upload-form" onSubmit={uploadMultipleVideos}>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '25px', 
                  borderRadius: '12px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
                    📹 Upload Multiple Videos to Module
                  </h4>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                      Select Multiple Video Files *
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleMultipleFileChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ffffffff',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    {multipleVideos.length > 0 && (
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        backgroundColor: '#e8f5e8', 
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#155724'
                      }}>
                        ✅ Selected {multipleVideos.length} video files
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Base Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Upper Body Exercise"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <small style={{ color: '#666' }}>Videos will be named: "Base Title - Part 1", "Part 2", etc.</small>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Common Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Description for all videos in this series..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || multipleVideos.length === 0}
                    style={{
                      width: '100%',
                      padding: '15px',
                      backgroundColor: loading || multipleVideos.length === 0 ? '#6c757d' : '#fd7e14',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading || multipleVideos.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading 
                      ? `⏳ Uploading ${currentVideoIndex}/${multipleVideos.length}...` 
                      : `🚀 Upload ${multipleVideos.length} Videos to Module`
                    }
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;

/*
//deepseek
// client/src/components/VideoUpload.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VideoUpload = ({ onVideoUploaded }) => {
  const [uploadType, setUploadType] = useState('individual'); // 'individual' or 'module'
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  
  // Form data for video upload
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [] // For individual videos
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Multiple video upload for modules
  const [multipleVideos, setMultipleVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    fetchPatients();
    fetchModules();
  }, []);

  // Validate video format
  const isValidVideoFormat = (file) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.mp4') || 
           file.name.toLowerCase().endsWith('.webm') || file.name.toLowerCase().endsWith('.ogg') ||
           file.name.toLowerCase().endsWith('.mov') || file.name.toLowerCase().endsWith('.avi');
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/videos/patients', {
        headers: {
          'x-auth-token': token
        }
      });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setMessage('Failed to load patients');
    }
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/modules/all', {
        headers: {
          'x-auth-token': token
        }
      });
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setMessage('Failed to load modules');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSingleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!isValidVideoFormat(file)) {
      setMessage('Please select a valid video file (MP4, WebM, OGG, MOV, or AVI)');
      setVideoFile(null);
      e.target.value = '';
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      setMessage('File size too large. Maximum size is 100MB.');
      setVideoFile(null);
      e.target.value = '';
      return;
    }
    
    setVideoFile(file);
    setMessage('');
  };

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      if (isValidVideoFormat(file) && file.size <= 100 * 1024 * 1024) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setMessage(`Some files were rejected: ${invalidFiles.join(', ')}. Only video files under 100MB are allowed.`);
    }
    
    setMultipleVideos(validFiles);
    if (validFiles.length > 0) {
      setMessage(`✅ Selected ${validFiles.length} valid video files`);
    }
  };

  const handlePatientSelect = (patientId) => {
    const updatedAssigned = formData.assignedTo.includes(patientId)
      ? formData.assignedTo.filter(id => id !== patientId)
      : [...formData.assignedTo, patientId];
    
    setFormData({
      ...formData,
      assignedTo: updatedAssigned
    });
  };

  // Upload single video (for individual videos)
  const uploadSingleVideo = async (e) => {
    e.preventDefault();
    
    if (!videoFile) {
      setMessage('Please select a video file');
      return;
    }

    if (uploadType === 'individual' && formData.assignedTo.length === 0) {
      setMessage('Please assign the video to at least one patient');
      return;
    }

    if (uploadType === 'module' && !selectedModule) {
      setMessage('Please select a module');
      return;
    }

    setLoading(true);
    setMessage('');
    setUploadProgress(0);

    const token = localStorage.getItem('token');
    const uploadData = new FormData();
    uploadData.append('video', videoFile);
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    
    if (uploadType === 'individual') {
      uploadData.append('assignedTo', JSON.stringify(formData.assignedTo));
    }

    try {
      // Upload video first
      const videoResponse = await axios.post('/api/videos/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      // If uploading to module, add video to module
      if (uploadType === 'module' && selectedModule) {
        await axios.post(`/api/modules/${selectedModule}/add-videos`, {
          videoIds: [videoResponse.data._id]
        }, {
          headers: {
            'x-auth-token': token
          }
        });
      }
      
      setMessage('✅ Video uploaded successfully!');
      resetForm();
      onVideoUploaded && onVideoUploaded();
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error uploading video. Please try again.';
      setMessage(`❌ ${errorMessage}`);
      
      if (!error.response) {
        setMessage('❌ Network error. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Upload multiple videos to module
  const uploadMultipleVideos = async (e) => {
    e.preventDefault();
    
    if (multipleVideos.length === 0) {
      setMessage('Please select at least one video file');
      return;
    }

    if (!selectedModule) {
      setMessage('Please select a module for multiple video upload');
      return;
    }

    setLoading(true);
    setMessage('');
    setCurrentVideoIndex(0);

    const token = localStorage.getItem('token');
    const uploadedVideoIds = [];

    try {
      // Upload videos one by one
      for (let i = 0; i < multipleVideos.length; i++) {
        const videoFile = multipleVideos[i];
        setCurrentVideoIndex(i + 1);
        setUploadProgress(0);

        const uploadData = new FormData();
        uploadData.append('video', videoFile);
        uploadData.append('title', `${formData.title} - Part ${i + 1}` || `Video ${i + 1}`);
        uploadData.append('description', formData.description || `Part ${i + 1} of the series`);
        uploadData.append('assignedTo', JSON.stringify([])); // No individual assignment for module videos

        const videoResponse = await axios.post('/api/videos/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              // Calculate progress for current file (0-100) and overall progress
              const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const overallProgress = Math.round((i * 100 + fileProgress) / multipleVideos.length);
              setUploadProgress(overallProgress);
            }
          }
        });

        uploadedVideoIds.push(videoResponse.data._id);
      }

      // Add all videos to the module
      if (uploadedVideoIds.length > 0) {
        await axios.post(`/api/modules/${selectedModule}/add-videos`, {
          videoIds: uploadedVideoIds
        }, {
          headers: {
            'x-auth-token': token
          }
        });
      }

      setMessage(`✅ Successfully uploaded ${multipleVideos.length} videos to the module!`);
      resetForm();
      onVideoUploaded && onVideoUploaded();

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error uploading videos. Please try again.';
      setMessage(`❌ ${errorMessage}`);
      
      if (!error.response) {
        setMessage('❌ Network error. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setCurrentVideoIndex(0);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', assignedTo: [] });
    setVideoFile(null);
    setMultipleVideos([]);
    setSelectedModule('');
    setUploadProgress(0);
    setCurrentVideoIndex(0);
    
    // Clear file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  };

  const getSelectedModuleName = () => {
    const module = modules.find(m => m._id === selectedModule);
    return module ? module.name : '';
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      // Upload Type Selection
      <div style={{ 
        marginBottom: '30px', 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '12px',
        border: '2px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
          📹 Choose Upload Method
        </h3>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            type="button"
            onClick={() => setUploadType('individual')}
            style={{
              padding: '15px 25px',
              backgroundColor: uploadType === 'individual' ? '#007bff' : 'white',
              color: uploadType === 'individual' ? 'white' : '#333',
              border: '2px solid #007bff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <span>🎥</span>
            Individual Video
          </button>
          
          <button
            type="button"
            onClick={() => setUploadType('module')}
            style={{
              padding: '15px 25px',
              backgroundColor: uploadType === 'module' ? '#28a745' : 'white',
              color: uploadType === 'module' ? 'white' : '#333',
              border: '2px solid #28a745',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <span>📚</span>
            Module Videos
          </button>
        </div>
        
        <div style={{ marginTop: '15px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', fontSize: '14px', color: '#666' }}>
          {uploadType === 'individual' ? (
            <><strong>📝 Individual Video:</strong> Upload a single video and assign it directly to specific patients</>
          ) : (
            <><strong>📚 Module Videos:</strong> Upload one or multiple videos directly into a training module</>
          )}
        </div>
      </div>

      // Message Display
      {message && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: message.includes('✅') || message.includes('Successfully') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') || message.includes('Successfully') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          color: message.includes('✅') || message.includes('Successfully') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

      //* Upload Progress
      {loading && (
        <div style={{ 
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {uploadType === 'module' && multipleVideos.length > 1 
                ? `Uploading video ${currentVideoIndex} of ${multipleVideos.length}...`
                : 'Uploading video...'
              }
            </span>
            <span style={{ fontSize: '14px', color: '#666' }}>{uploadProgress}%</span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      //* INDIVIDUAL VIDEO UPLOAD FORM
      {uploadType === 'individual' && (
        <form id="video-upload-form" onSubmit={uploadSingleVideo}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '25px', 
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
              🎥 Upload Individual Video
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Video Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Shoulder Flexibility Exercise"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Select Video File *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleSingleFileChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Supported formats: MP4, WebM, OGG, MOV, AVI (Max: 100MB)
                </small>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the exercise, instructions, and benefits..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                Assign to Patients *
              </label>
              <div style={{ 
                border: '2px solid #e9ecef', 
                borderRadius: '6px', 
                padding: '15px',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#f8f9fa'
              }}>
                {patients.map(patient => (
                  <div key={patient._id} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px', borderRadius: '4px', backgroundColor: 'white' }}>
                      <input
                        type="checkbox"
                        checked={formData.assignedTo.includes(patient._id)}
                        onChange={() => handlePatientSelect(patient._id)}
                        style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{patient.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{patient.email}</div>
                      </div>
                    </label>
                  </div>
                ))}
                {patients.length === 0 && (
                  <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                    No patients available
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? '⏳ Uploading...' : '🚀 Upload Individual Video'}
            </button>
          </div>
        </form>
      )}

      //{/* MODULE VIDEO UPLOAD FORM 
      {uploadType === 'module' && (
        <div>
          //{/* Module Selection 
          <div style={{ 
            backgroundColor: 'white', 
            padding: '25px', 
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
              📚 Select Target Module
            </h3>

            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                Choose Module *
              </label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Select a module to add videos --</option>
                {modules.map(module => (
                  <option key={module._id} value={module._id}>
                    {module.category?.toUpperCase()} - {module.name} ({module.videos?.length || 0} videos)
                  </option>
                ))}
              </select>
              
              {selectedModule && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '12px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  ✅ Selected: <strong>{getSelectedModuleName()}</strong>
                </div>
              )}
            </div>

            {modules.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                color: '#856404'
              }}>
                <p style={{ margin: 0 }}>
                  📝 <strong>No modules available.</strong><br/>
                  Create a module first in the Module Manager to upload videos to it.
                </p>
              </div>
            )}
          </div>

          // Video Upload Options
          {selectedModule && (
            <>
              //* Single Video to Module
              <form id="video-upload-form" onSubmit={uploadSingleVideo} style={{ marginBottom: '30px' }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '25px', 
                  borderRadius: '12px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
                    🎥 Upload Single Video to Module
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Video Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Exercise 1 - Warm Up"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Select Video File *
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleSingleFileChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                        Supported formats: MP4, WebM, OGG, MOV, AVI (Max: 100MB)
                      </small>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe this specific exercise..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '15px',
                      backgroundColor: loading ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '⏳ Uploading...' : '📚 Add Video to Module'}
                  </button>
                </div>
              </form>

              //* Multiple Videos to Module
              <form id="multiple-video-upload-form" onSubmit={uploadMultipleVideos}>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '25px', 
                  borderRadius: '12px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
                    📹 Upload Multiple Videos to Module
                  </h4>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                      Select Multiple Video Files *
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleMultipleFileChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      Select multiple video files (MP4, WebM, OGG, MOV, AVI) - Max 100MB each
                    </small>
                    {multipleVideos.length > 0 && (
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        backgroundColor: '#e8f5e8', 
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#155724'
                      }}>
                        ✅ Selected {multipleVideos.length} valid video files
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Base Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Upper Body Exercise"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <small style={{ color: '#666' }}>Videos will be named: "Base Title - Part 1", "Part 2", etc.</small>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        Common Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Description for all videos in this series..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || multipleVideos.length === 0}
                    style={{
                      width: '100%',
                      padding: '15px',
                      backgroundColor: loading || multipleVideos.length === 0 ? '#6c757d' : '#fd7e14',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading || multipleVideos.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading 
                      ? `⏳ Uploading ${currentVideoIndex}/${multipleVideos.length}...` 
                      : `🚀 Upload ${multipleVideos.length} Videos to Module`
                    }
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
*/