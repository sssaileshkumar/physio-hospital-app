
// VideoList.js - Display videos for both admin and patients
import React from 'react';

const VideoList = ({ videos, user }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (videos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>No videos available</h3>
        <p style={{ color: '#666' }}>
          {user.role === 'admin' 
            ? 'Start by uploading your first video for patients.'
            : 'Your doctor hasn\'t assigned any videos to you yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>
        {user.role === 'admin' ? 'Uploaded Videos' : 'Your Exercise Videos'}
      </h2>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {videos.map(video => (
          <div
            key={video._id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f8f9fa'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                  {video.title}
                </h3>
                
                {video.description && (
                  <p style={{ color: '#666', marginBottom: '10px' }}>
                    {video.description}
                  </p>
                )}
                
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '15px' }}>
                  Uploaded on {formatDate(video.createdAt)}
                </div>

                {/* Show assigned patients for admin */}
                {user.role === 'admin' && video.assignedTo && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ fontSize: '14px', color: '#333' }}>
                      Assigned to:
                    </strong>
                    <div style={{ marginTop: '5px' }}>
                      {video.assignedTo.map(patient => (
                        <span
                          key={patient._id}
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            marginRight: '5px',
                            marginBottom: '5px'
                          }}
                        >
                          {patient.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video player */}
                <video
                  controls
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    height: 'auto',
                    borderRadius: '4px'
                  }}
                >
                  <source src={`${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/${video.filename}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoList;
