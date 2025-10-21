/*
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

         //Stats Dashboard - Only for Admin 
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

        //
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
          
          //admin tabs
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
            // Patient Tabs 
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

        // Content Area 
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: '500px'
        }}>
          
          // Module Content 
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

          // Individual Videos Content
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

        //Upload Content 
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

          // Chat Content
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

        //Footer
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
*/

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
  const StatCard = ({ title, value, icon, color = '#2E8B57', subtitle }) => (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-title">{title}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        
        
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="greeting">
              {getGreeting()}, {user.name}! <span className="greeting-emoji">👋</span>
            </h1>
            <p className="welcome-text">
              Welcome back, <span className="role-highlight">{getRoleDisplay(user.role)}</span> • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="header-actions">
            <div className="user-info">
              <div className="user-label">Logged in as</div>
              <div className="user-email">
                {user.email}
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="logout-btn"
            >
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>

        {/* Stats Dashboard - Only for Admin */}
        {user.role === 'admin' && (
          <div className="stats-grid">
            <StatCard
              title="Total Modules"
              value={stats.totalModules}
              icon="📚"
              color="#2E8B57"
            />
            <StatCard
              title="Individual Videos"
              value={stats.totalVideos}
              icon="🎥"
              color="#1E88E5"
            />
            <StatCard
              title="Active Patients"
              value={stats.totalPatients}
              icon="👥"
              color="#7E57C2"
            />
            <StatCard
              title="Platform Status"
              value="Active"
              icon="🟢"
              color="#2E8B57"
              subtitle="All systems operational"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="tabs-container">
          
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
        <div className="content-area">
          
          {/* Module Content */}
          {activeTab === 'modules' && (
            <div className="tab-content">
              {user.role === 'admin' ? (
                <>
                  <div className="tab-header">
                    <div>
                      <h2 className="tab-title">
                        <span className="tab-icon">📚</span>
                        Module Management Center
                      </h2>
                      <p className="tab-description">
                        Create, organize, and assign training modules to your patients
                      </p>
                    </div>
                  </div>
                  <ModuleManager onModuleCreated={refreshData} />
                </>
              ) : (
                <>
                  <div className="tab-header">
                    <div>
                      <h2 className="tab-title">
                        <span className="tab-icon">🏋️</span>
                        My Training Modules
                      </h2>
                      <p className="tab-description">
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
            <div className="tab-content">
              <div className="tab-header">
                <div>
                  <h2 className="tab-title">
                    <span className="tab-icon">🎥</span>
                    {user.role === 'admin' ? 'Video Library' : 'My Individual Videos'}
                  </h2>
                  <p className="tab-description">
                    {user.role === 'admin' 
                      ? 'Manage your video collection and assign individual videos to patients'
                      : 'Watch individual exercise videos assigned specifically to you'
                    }
                  </p>
                </div>
                
                {user.role === 'admin' && videos.length > 0 && (
                  <div className="video-count">
                    Total Videos: <strong>{videos.length}</strong>
                  </div>
                )}
              </div>
              
              <VideoList videos={videos} user={user} onVideoUpdate={fetchVideos} />
            </div>
          )}

          {/* Upload Content */}
          {activeTab === 'upload' && user.role === 'admin' && (
            <div className="tab-content">
              <div className="tab-header">
                <div>
                  <h2 className="tab-title">
                    <span className="tab-icon">⬆️</span>
                    Upload New Content
                  </h2>
                  <p className="tab-description">
                    Upload exercise videos to build your content library
                  </p>
                </div>
              </div>
              
              <VideoUpload onVideoUploaded={refreshData} />
            </div>
          )}

          {/* Chat Content */}
          {activeTab === 'chat' && (
            <div className="tab-content">
              <div className="tab-header">
                <div>
                  <h2 className="tab-title">
                    <span className="tab-icon">💬</span>
                    {user.role === 'admin' ? 'Patient Communication' : 'Chat with Your Doctor'}
                  </h2>
                  <p className="tab-description">
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
        <div className="dashboard-footer">
          <div className="footer-main">
            🏥 <strong>PhysioTherapy Management System</strong> • 
            Empowering recovery through technology
          </div>
          <div className="footer-sub">
            Built with <span className="heart">❤️</span> for healthcare professionals and patients
          </div>
        </div>
      </div>

      {/* Add the CSS styles */}
      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: 
            radial-gradient(circle at 20% 80%, rgba(46, 139, 87, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(30, 136, 229, 0.05) 0%, transparent 50%),
            #0F172A;
          padding: 20px;
          position: relative;
        }

        .dashboard-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header Styles */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          padding: 25px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .dashboard-header:hover {
          border-color: rgba(46, 139, 87, 0.3);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
        }

        .greeting {
          margin: 0 0 8px 0;
          color: #F8FAFC;
          font-size: 28px;
          font-weight: 700;
        }

        .greeting-emoji {
          -webkit-text-fill-color: initial;
          background: none;
        }

        .welcome-text {
          margin: 0;
          color: #94A3B8;
          font-size: 16px;
          font-weight: 400;
        }

        .role-highlight {
          color: #2E8B57;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-info {
          text-align: right;
          margin-right: 15px;
        }

        .user-label {
          font-size: 14px;
          color: #94A3B8;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 16px;
          font-weight: 600;
          color: #F8FAFC;
        }

        .logout-btn {
          padding: 12px 20px;
          background: rgba(220, 38, 38, 0.1);
          color: #EF4444;
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logout-btn:hover {
          background: rgba(220, 38, 38, 0.2);
          border-color: rgba(220, 38, 38, 0.5);
          transform: translateY(-1px);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 25px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
          transition: left 0.6s;
        }

        .stat-card:hover::before {
          left: 100%;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(46, 139, 87, 0.3);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 15px;
          opacity: 0.9;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .stat-title {
          font-size: 14px;
          color: #94A3B8;
          font-weight: 500;
          margin-bottom: 5px;
        }

        .stat-subtitle {
          font-size: 12px;
          color: #94A3B8;
          opacity: 0.8;
        }

        /* Tabs */
        .tabs-container {
          margin-bottom: 30px;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        /* Content Area */
        .content-area {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          min-height: 500px;
          transition: all 0.3s ease;
        }

        .content-area:hover {
          border-color: rgba(46, 139, 87, 0.2);
        }

        .tab-content {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.05);
        }

        .tab-title {
          margin: 0 0 8px 0;
          color: #F8FAFC;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tab-icon {
          font-size: 28px;
          opacity: 0.9;
        }

        .tab-description {
          margin: 0;
          color: #94A3B8;
          font-size: 16px;
          line-height: 1.5;
        }

        .video-count {
          font-size: 14px;
          color: #94A3B8;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Footer */
        .dashboard-footer {
          text-align: center;
          margin-top: 40px;
          padding: 25px;
          color: #94A3B8;
          font-size: 14px;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-main {
          margin-bottom: 8px;
          font-weight: 500;
        }

        .footer-sub {
          opacity: 0.8;
        }

        .heart {
          color: #EF4444;
          animation: heartbeat 2s infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .header-actions {
            flex-direction: column;
            gap: 15px;
          }

          .user-info {
            text-align: center;
            margin-right: 0;
          }

          .tabs-container {
            flex-direction: column;
          }

          .tab-header {
            flex-direction: column;
            gap: 15px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`tab-button ${active ? 'active' : ''}`}
  >
    <span className="tab-button-icon">{icon}</span>
    <span className="tab-button-label">{label}</span>

    <style jsx>{`
      .tab-button {
        padding: 14px 20px;
        background: ${active ? 'rgba(46, 139, 87, 0.2)' : 'transparent'};
        color: ${active ? '#2E8B57' : '#94A3B8'};
        border: ${active ? '1px solid rgba(46, 139, 87, 0.3)' : '1px solid transparent'};
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
      }

      .tab-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
        transition: left 0.5s;
      }

      .tab-button:hover::before {
        left: 100%;
      }

      .tab-button:hover {
        background: ${active ? 'rgba(46, 139, 87, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
        color: ${active ? '#2E8B57' : '#F8FAFC'};
        border-color: ${active ? 'rgba(46, 139, 87, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
        transform: translateY(-1px);
      }

      .tab-button-icon {
        font-size: 16px;
      }

      .tab-button-label {
        position: relative;
        z-index: 1;
      }
    `}</style>
  </button>
);

export default Dashboard;
