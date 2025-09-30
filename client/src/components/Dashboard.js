// client/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoUpload from './VideoUpload';
import VideoList from './VideoList';
import ModuleManager from './ModuleManager';
import ModuleViewer from './ModuleViewer';
import Chat from './Chat';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(user.role === 'admin' ? 'modules' : 'modules');
  const [videos, setVideos] = useState([]);
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalModules: 0,
    totalPatients: 0,
    completionRate: 0
  });

  // Fetch data when component loads
  useEffect(() => {
    fetchVideos();
    if (user.role === 'admin') {
      fetchModules();
      fetchStats();
    }
  }, [user.role]);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/videos/my-videos');
      setVideos(response.data);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalVideos: response.data.length
      }));
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.get('/modules/all');
      setModules(response.data);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalModules: response.data.length
      }));
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch additional stats for admin
      const [patientsResponse] = await Promise.all([
        axios.get('/videos/patients')
      ]);
      
      setStats(prev => ({
        ...prev,
        totalPatients: patientsResponse.data.length
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const refreshData = () => {
    fetchVideos();
    if (user.role === 'admin') {
      fetchModules();
      fetchStats();
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user role display
  const getRoleDisplay = (role) => {
    return role === 'admin' ? 'Doctor' : 'Patient';
  };

  // Stats card component
  const StatCard = ({ title, value, icon, color = '#007bff', subtitle }) => (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e9ecef',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color: color,
        marginBottom: '5px' 
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '14px', 
        color: '#666',
        fontWeight: '500',
        marginBottom: subtitle ? '3px' : '0'
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#999' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              color: '#333',
              fontSize: '28px',
              fontWeight: '600'
            }}>
              {getGreeting()}, {user.name}! 👋
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#666',
              fontSize: '16px'
            }}>
              Welcome back, {getRoleDisplay(user.role)} • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right', marginRight: '15px' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Logged in as</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {user.email}
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Dashboard - Only for Admin */}
        {user.role === 'admin' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Total Modules"
              value={stats.totalModules}
              icon="📚"
              color="#28a745"
            />
            <StatCard
              title="Individual Videos"
              value={stats.totalVideos}
              icon="🎥"
              color="#007bff"
            />
            <StatCard
              title="Active Patients"
              value={stats.totalPatients}
              icon="👥"
              color="#6f42c1"
            />
            <StatCard
              title="Platform Status"
              value="Active"
              icon="🟢"
              color="#28a745"
              subtitle="All systems operational"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ 
          marginBottom: '30px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          
          {/* Admin Tabs */}
          {user.role === 'admin' ? (
            <>
              <TabButton
                active={activeTab === 'modules'}
                onClick={() => setActiveTab('modules')}
                icon="📚"
                label="Module Manager"
              />
              <TabButton
                active={activeTab === 'videos'}
                onClick={() => setActiveTab('videos')}
                icon="🎥"
                label="Individual Videos"
              />
              <TabButton
                active={activeTab === 'upload'}
                onClick={() => setActiveTab('upload')}
                icon="⬆️"
                label="Upload Content"
              />
              <TabButton
                active={activeTab === 'chat'}
                onClick={() => setActiveTab('chat')}
                icon="💬"
                label="Patient Chat"
              />
            </>
          ) : (
            /* Patient Tabs */
            <>
              <TabButton
                active={activeTab === 'modules'}
                onClick={() => setActiveTab('modules')}
                icon="🏋️"
                label="My Training Modules"
              />
              <TabButton
                active={activeTab === 'videos'}
                onClick={() => setActiveTab('videos')}
                icon="🎥"
                label="Individual Videos"
              />
              <TabButton
                active={activeTab === 'chat'}
                onClick={() => setActiveTab('chat')}
                icon="💬"
                label="Chat with Doctor"
              />
            </>
          )}
        </div>

        {/* Content Area */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: '500px'
        }}>
          
          {/* Module Content */}
          {activeTab === 'modules' && (
            <div>
              {user.role === 'admin' ? (
                <>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '25px',
                    paddingBottom: '20px',
                    borderBottom: '2px solid #f8f9fa'
                  }}>
                    <div>
                      <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        📚 Module Management Center
                      </h2>
                      <p style={{ margin: 0, color: '#666' }}>
                        Create, organize, and assign training modules to your patients
                      </p>
                    </div>
                  </div>
                  <ModuleManager onModuleCreated={refreshData} />
                </>
              ) : (
                <>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '25px',
                    paddingBottom: '20px',
                    borderBottom: '2px solid #f8f9fa'
                  }}>
                    <div>
                      <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        🏋️ My Training Modules
                      </h2>
                      <p style={{ margin: 0, color: '#666' }}>
                        Complete your assigned physiotherapy exercises and track your progress
                      </p>
                    </div>
                  </div>
                  <ModuleViewer user={user} />
                </>
              )}
            </div>
          )}

          {/* Individual Videos Content */}
          {activeTab === 'videos' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: '2px solid #f8f9fa'
              }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>
                    🎥 {user.role === 'admin' ? 'Video Library' : 'My Individual Videos'}
                  </h2>
                  <p style={{ margin: 0, color: '#666' }}>
                    {user.role === 'admin' 
                      ? 'Manage your video collection and assign individual videos to patients'
                      : 'Watch individual exercise videos assigned specifically to you'
                    }
                  </p>
                </div>
                
                {user.role === 'admin' && videos.length > 0 && (
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Total Videos: <strong>{videos.length}</strong>
                  </div>
                )}
              </div>
              
              <VideoList videos={videos} user={user} onVideoUpdate={fetchVideos} />
            </div>
          )}

          {/* Upload Content */}
          {activeTab === 'upload' && user.role === 'admin' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: '2px solid #f8f9fa'
              }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>
                    ⬆️ Upload New Content
                  </h2>
                  <p style={{ margin: 0, color: '#666' }}>
                    Upload exercise videos to build your content library
                  </p>
                </div>
              </div>
              
              <VideoUpload onVideoUploaded={refreshData} />
            </div>
          )}

          {/* Chat Content */}
          {activeTab === 'chat' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: '2px solid #f8f9fa'
              }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>
                    💬 {user.role === 'admin' ? 'Patient Communication' : 'Chat with Your Doctor'}
                  </h2>
                  <p style={{ margin: 0, color: '#666' }}>
                    {user.role === 'admin' 
                      ? 'Communicate with your patients and provide guidance'
                      : 'Get support and ask questions about your treatment plan'
                    }
                  </p>
                </div>
              </div>
              
              <Chat user={user} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '20px',
          color: '#666',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            🏥 <strong>PhysioTherapy Management System</strong> • 
            Empowering recovery through technology
          </div>
          <div>
            Built with ❤️ for healthcare professionals and patients
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      padding: '12px 20px',
      backgroundColor: active ? '#007bff' : 'transparent',
      color: active ? 'white' : '#666',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.target.style.backgroundColor = '#f8f9fa';
        e.target.style.color = '#333';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.target.style.backgroundColor = 'transparent';
        e.target.style.color = '#666';
      }
    }}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

export default Dashboard;