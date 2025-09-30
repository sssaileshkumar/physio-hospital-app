
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModuleManager = ({ onModuleCreated }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [modules, setModules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  // Module creation form
  const [moduleForm, setModuleForm] = useState({
    name: '',
    description: '',
    category: 'general',
    difficulty: 'beginner',
    duration: 30,
    tags: ''
  });

  const categories = [
    { value: 'arms', label: 'Arms' },
    { value: 'legs', label: 'Legs' },
    { value: 'back', label: 'Back' },
    { value: 'chest', label: 'Chest' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'core', label: 'Core' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'rehabilitation', label: 'Rehabilitation' },
    { value: 'general', label: 'General' }
  ];

  useEffect(() => {
    fetchModules();
    fetchVideos();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get('/modules/all');
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/videos/my-videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      const moduleData = {
        ...moduleForm,
        tags: moduleForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post('/modules/create', moduleData);
      
      // Reset form
      setModuleForm({
        name: '',
        description: '',
        category: 'general',
        difficulty: 'beginner',
        duration: 30,
        tags: ''
      });

      fetchModules();
      onModuleCreated && onModuleCreated();
      alert('Module created successfully!');
    } catch (error) {
      alert('Error creating module: ' + (error.response?.data?.message || error.message));
    }
  };

  const addVideosToModule = async (moduleId, videoIds) => {
    try {
      await axios.post(`/modules/${moduleId}/add-videos`, { videoIds });
      fetchModules();
      alert('Videos added to module successfully!');
    } catch (error) {
      alert('Error adding videos: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Module Manager</h2>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px' }}>
        {['create', 'manage'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: activeTab === tab ? '#007bff' : '#f8f9fa',
              color: activeTab === tab ? 'white' : 'black',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {tab === 'create' ? 'Create Module' : 'Manage Modules'}
          </button>
        ))}
      </div>

      {/* Create Module Tab */}
      {activeTab === 'create' && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h3>Create New Module</h3>
          <form onSubmit={handleCreateModule}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Module Name *
                </label>
                <input
                  type="text"
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                  required
                  placeholder="e.g., Upper Body Strength"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Category *
                </label>
                <select
                  value={moduleForm.category}
                  onChange={(e) => setModuleForm({...moduleForm, category: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Difficulty Level
                </label>
                <select
                  value={moduleForm.difficulty}
                  onChange={(e) => setModuleForm({...moduleForm, difficulty: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={moduleForm.duration}
                  onChange={(e) => setModuleForm({...moduleForm, duration: parseInt(e.target.value)})}
                  min="1"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description *
              </label>
              <textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                required
                rows={4}
                placeholder="Describe what this module covers and its benefits..."
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={moduleForm.tags}
                onChange={(e) => setModuleForm({...moduleForm, tags: e.target.value})}
                placeholder="e.g., strength, mobility, recovery"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '20px',
                padding: '12px 30px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Create Module
            </button>
          </form>
        </div>
      )}

      {/* Manage Modules Tab */}
      {activeTab === 'manage' && (
        <div>
          <div style={{ display: 'grid', gap: '20px' }}>
            {modules.map(module => (
              <ModuleCard
                key={module._id}
                module={module}
                videos={videos}
                onAddVideos={addVideosToModule}
                onModuleUpdate={fetchModules}
              />
            ))}
          </div>
          
          {modules.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>No modules created yet</h3>
              <p>Create your first module to organize your videos better!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Module Card Component
const ModuleCard = ({ module, videos, onAddVideos, onModuleUpdate }) => {
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const availableVideos = videos.filter(video => 
    !module.videos.some(mv => mv._id === video._id)
  );

  const handleAddVideos = () => {
    if (selectedVideoIds.length > 0) {
      onAddVideos(module._id, selectedVideoIds);
      setSelectedVideoIds([]);
      setShowVideoSelector(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      arms: '💪', legs: '🦵', back: '🏋️', chest: '💯', 
      shoulders: '🤸', core: '⚡', cardio: '❤️', 
      rehabilitation: '🏥', general: '📋'
    };
    return icons[category] || '📋';
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      
      {/* Module Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px', fontSize: '24px' }}>
              {getCategoryIcon(module.category)}
            </span>
            {module.name}
          </h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px' }}>
            <span style={{ 
              backgroundColor: getDifficultyColor(module.difficulty),
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              textTransform: 'capitalize'
            }}>
              {module.difficulty}
            </span>
            
            <span style={{ color: '#666' }}>
              {module.category.toUpperCase()}
            </span>
            
            <span style={{ color: '#666' }}>
              📅 {module.duration} min
            </span>
            
            <span style={{ color: '#666' }}>
              🎥 {module.videos.length} videos
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowVideoSelector(!showVideoSelector)}
            style={{
              padding: '8px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Add Videos
          </button>
          
          <button
            onClick={() => setShowAssignModal(true)}
            style={{
              padding: '8px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Assign to Patients
          </button>
        </div>
      </div>

      {/* Description */}
      <p style={{ color: '#666', marginBottom: '15px' }}>
        {module.description}
      </p>

      {/* Tags */}
      {module.tags && module.tags.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          {module.tags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                backgroundColor: '#e9ecef',
                color: '#495057',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                marginRight: '5px',
                marginBottom: '5px'
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Videos in Module */}
      {module.videos && module.videos.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '10px' }}>Videos in this module:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {module.videos.map((video, index) => (
              <div
                key={video._id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {index + 1}. {video.title}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {video.description || 'No description'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Selector */}
      {showVideoSelector && (
        <div style={{
          marginTop: '20px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '15px',
          backgroundColor: '#f8f9fa'
        }}>
          <h4>Add Videos to Module</h4>
          
          {availableVideos.length === 0 ? (
            <p style={{ color: '#666' }}>All videos are already in this module or no videos available.</p>
          ) : (
            <>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
                {availableVideos.map(video => (
                  <div key={video._id} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.includes(video._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVideoIds([...selectedVideoIds, video._id]);
                          } else {
                            setSelectedVideoIds(selectedVideoIds.filter(id => id !== video._id));
                          }
                        }}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{video.title}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {video.description || 'No description'}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAddVideos}
                  disabled={selectedVideoIds.length === 0}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: selectedVideoIds.length === 0 ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedVideoIds.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Add Selected ({selectedVideoIds.length})
                </button>
                
                <button
                  onClick={() => {
                    setShowVideoSelector(false);
                    setSelectedVideoIds([]);
                  }}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <AssignModuleModal
          module={module}
          onClose={() => setShowAssignModal(false)}
          onAssign={() => {
            setShowAssignModal(false);
            onModuleUpdate();
          }}
        />
      )}
    </div>
  );
};

// Assignment Modal Component
const AssignModuleModal = ({ module, onClose, onAssign }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/videos/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleAssign = async () => {
    try {
      await axios.post(`/modules/${module._id}/assign`, {
        patientIds: selectedPatients,
        dueDate: dueDate || null,
        notes
      });
      
      alert('Module assigned successfully!');
      onAssign();
    } catch (error) {
      alert('Error assigning module: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h3>Assign Module: {module.name}</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Select Patients:
          </label>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '10px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {patients.map(patient => (
              <div key={patient._id} style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPatients.includes(patient._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPatients([...selectedPatients, patient._id]);
                      } else {
                        setSelectedPatients(selectedPatients.filter(id => id !== patient._id));
                      }
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  {patient.name} ({patient.email})
                </label>
              </div>
            ))}
            {patients.length === 0 && (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No patients available</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Due Date (Optional):
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Notes (Optional):
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional instructions or notes for the patient..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleAssign}
            disabled={selectedPatients.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedPatients.length === 0 ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedPatients.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Assign Module ({selectedPatients.length} patients)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleManager;