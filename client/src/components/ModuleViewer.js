
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModuleViewer = ({ user }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [completedVideos, setCompletedVideos] = useState(new Set());

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/modules/patient/assigned');
      setAssignments(response.data);
      
      // Extract completed videos
      const completed = new Set();
      response.data.forEach(assignment => {
        assignment.progress.completedVideos.forEach(cv => {
          completed.add(cv.video);
        });
      });
      setCompletedVideos(completed);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const markVideoComplete = async (videoId) => {
    try {
      await axios.post(`/modules/progress/video/${videoId}`);
      setCompletedVideos(new Set([...completedVideos, videoId]));
      
      // Move to next video automatically
      if (selectedModule && currentVideoIndex < selectedModule.videos.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      }
    } catch (error) {
      console.error('Error marking video complete:', error);
    }
  };

  const getModuleProgress = (module) => {
    if (!module || !module.videos) return 0;
    const completed = module.videos.filter(video => completedVideos.has(video._id)).length;
    return Math.round((completed / module.videos.length) * 100);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (selectedModule) {
    const currentVideo = selectedModule.videos[currentVideoIndex];
    const isCurrentVideoCompleted = completedVideos.has(currentVideo?._id);

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedModule(null);
            setCurrentVideoIndex(0);
          }}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Modules
        </button>

        {/* Module Header */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', margin: '0 0 10px 0' }}>
            <span style={{ marginRight: '15px', fontSize: '32px' }}>
              {getCategoryIcon(selectedModule.category)}
            </span>
            {selectedModule.name}
          </h2>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ 
              backgroundColor: getDifficultyColor(selectedModule.difficulty),
              color: 'white',
              padding: '4px 12px',
              borderRadius: '15px',
              fontSize: '14px',
              textTransform: 'capitalize'
            }}>
              {selectedModule.difficulty}
            </span>
            
            <span style={{ color: '#666' }}>
              📅 {selectedModule.duration} minutes
            </span>
            
            <span style={{ color: '#666' }}>
              🎥 {currentVideoIndex + 1} of {selectedModule.videos.length}
            </span>
            
            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
              {getModuleProgress(selectedModule)}% Complete
            </span>
          </div>

          <p style={{ color: '#666', margin: 0 }}>
            {selectedModule.description}
          </p>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            marginTop: '15px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getModuleProgress(selectedModule)}%`,
              height: '100%',
              backgroundColor: '#28a745',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Video Player Section */}
        <div style={{ display: 'flex', gap: '20px' }}>
          
          {/* Main Video Player */}
          <div style={{ flex: '2' }}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'white'
            }}>
              <h3 style={{ marginTop: 0 }}>
                {currentVideo?.title}
                {isCurrentVideoCompleted && (
                  <span style={{ color: '#28a745', marginLeft: '10px' }}>✅</span>
                )}
              </h3>
              
              {currentVideo?.description && (
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  {currentVideo.description}
                </p>
              )}

              <video
                controls
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}
                onEnded={() => {
                  if (!isCurrentVideoCompleted) {
                    markVideoComplete(currentVideo._id);
                  }
                }}
              >
                <source src={`http://localhost:5000/uploads/${currentVideo?.filename}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Video Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
                    disabled={currentVideoIndex === 0}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: currentVideoIndex === 0 ? '#6c757d' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: currentVideoIndex === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <button
                    onClick={() => setCurrentVideoIndex(Math.min(selectedModule.videos.length - 1, currentVideoIndex + 1))}
                    disabled={currentVideoIndex === selectedModule.videos.length - 1}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: currentVideoIndex === selectedModule.videos.length - 1 ? '#6c757d' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: currentVideoIndex === selectedModule.videos.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next →
                  </button>
                </div>

                {!isCurrentVideoCompleted && (
                  <button
                    onClick={() => markVideoComplete(currentVideo._id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Mark as Complete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Video Playlist */}
          <div style={{ flex: '1' }}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'white',
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Video Playlist</h4>
              
              {selectedModule.videos.map((video, index) => (
                <div
                  key={video._id}
                  onClick={() => setCurrentVideoIndex(index)}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: index === currentVideoIndex ? '#e3f2fd' : 
                                   completedVideos.has(video._id) ? '#e8f5e8' : '#f8f9fa',
                    borderColor: index === currentVideoIndex ? '#2196f3' : '#eee'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        {index + 1}. {video.title}
                      </div>
                      {video.description && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {video.description.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                    
                    {completedVideos.has(video._id) && (
                      <span style={{ color: '#28a745', fontSize: '18px' }}>✅</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2>My Training Modules</h2>
      
      {assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <h3>No modules assigned yet</h3>
          <p>Your doctor will assign training modules to help with your recovery.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          {assignments.map(assignment => 
            assignment.modules.map(module => (
              <div
                key={module._id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => setSelectedModule(module)}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-5px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
              >
                {/* Module Header */}
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '12px', fontSize: '28px' }}>
                      {getCategoryIcon(module.category)}
                    </span>
                    {module.name}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ 
                      backgroundColor: getDifficultyColor(module.difficulty),
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}>
                      {module.difficulty}
                    </span>
                    
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {module.category.toUpperCase()}
                    </span>
                    
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      📅 {module.duration} min
                    </span>
                    
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      🎥 {module.videos.length} videos
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                  {module.description}
                </p>

                {/* Progress */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Progress</span>
                    <span style={{ fontSize: '14px', color: '#28a745' }}>
                      {getModuleProgress(module)}%
                    </span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${getModuleProgress(module)}%`,
                      height: '100%',
                      backgroundColor: '#28a745',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Assignment Info */}
                <div style={{ fontSize: '12px', color: '#666', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                  <div>Assigned by: Dr. {assignment.assignedBy.name}</div>
                  <div>Assigned: {formatDate(assignment.createdAt)}</div>
                  {assignment.dueDate && (
                    <div>Due: {formatDate(assignment.dueDate)}</div>
                  )}
                  {assignment.notes && (
                    <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
                      "{assignment.notes}"
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div style={{ marginTop: '15px' }}>
                  <button
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: getModuleProgress(module) === 100 ? '#28a745' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {getModuleProgress(module) === 100 ? '✅ Completed' : '▶️ Continue Training'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleViewer;