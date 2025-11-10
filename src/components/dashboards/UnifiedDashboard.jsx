import React from 'react';
import { 
  LayoutDashboard, 
  FileText,
  CheckCircle,
  ListChecks,
  Database,
  Briefcase,
  Calendar,
  Truck,
  Bell,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import swachLogo from '../../assets/logos/swach.png';
import Header from '../common/Header';
import DashboardContent from './DashboardContent';
import ComplaintsContent from './ComplaintsContent';
import AttendanceContent from './AttendanceContent';
import InspectionContent from './InspectionContent';
import VillageMasterContent from './VillageMasterContent';
import SchemesContent from './SchemesContent';
import EventsContent from './EventsContent';
import NotoficationContent from './NoticeContent';
import GpsTrackingContent from './GpsTrackingContent';
import PaymentsContent from './PaymentsContent';
import FeedbacksContent from './FeedbacksContent';

const Sidebar = ({ activeItem, setActiveItem }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Complaints', icon: FileText },
    { name: 'Attendance', icon: CheckCircle },
    { name: 'Inspection', icon: ListChecks },
    { name: 'GP Master Data', icon: Database },
    { name: 'Schemes', icon: Briefcase },
    { name: 'Events', icon: Calendar },
    { name: 'GPS Tracking', icon: Truck },
    { name: 'Payments', icon: CreditCard },
    { name: 'Notices', icon: Bell },
    { name: 'Feedbacks', icon: MessageSquare }
  ];

 return (
    <aside style={{
      width: '272px',
      height: '100vh',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0
    }}>
      {/* Logo Section */}
      <div style={{
        paddingLeft: '6px',
        paddingRight: '6px',
        margin: 0
      }}>
       <div style={{
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         gap: '12px',
         backgroundColor: 'white',
         border: '1px solid #d1d5db',
         borderRadius: '8px',
         margin: 10,
         padding: '5px'
       }}>
          {/* Swach Logo */}
          <div style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={swachLogo} 
              alt="Swach Logo" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <div>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#059669',
              margin: 0
            }}>SBMG</h2>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        paddingLeft: '16px',
        paddingRight: '16px',
        overflowY: 'auto',
        margin: 0
      }}>
        <ul style={{
          margin: 0,
          padding: 0,
          listStyle: 'none'
        }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.name === activeItem;
            
            return (
              <li key={item.name} style={{marginTop: '10px'}}>
                <button
                  onClick={() => setActiveItem(item.name)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '8px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    position: 'relative',
                    backgroundColor: isActive ? '#e5e7eb' : 'transparent',
                    color: isActive ? '#111827' : '#374151',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px 8px',
                    paddingLeft: '30px'
                  }}
                >
                  <Icon style={{
                    width: '20px',
                    height: '20px',
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>{item.name}</span>
                 
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

const UnifiedDashboard = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        return <DashboardContent />;
      case 'Complaints':
        return <ComplaintsContent />;
      case 'Attendance':
        return <AttendanceContent />;
      case 'Inspection':
        return <InspectionContent />;
      case 'GP Master Data':
        return <VillageMasterContent />;
      case 'Schemes':
        return <SchemesContent />;
      case 'Events':
        return <EventsContent />;
      case 'GPS Tracking':
        return <GpsTrackingContent />;
      case 'Payments':
        return <PaymentsContent />;
      case 'Notices':
        return <NotoficationContent />;
      case 'Feedbacks':
        return <FeedbacksContent />;
      default:
        return (
          <div style={{ padding: '4px' }}>
            <h2 style={{ color: '#374151', fontSize: '20px' }}>{activeItem} Content</h2>
            <p style={{ color: '#6b7280' }}>This is the {activeItem} section content.</p>
          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: 'white',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        width: isSidebarOpen ? '272px' : '0px',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      </div>
      <div style={{
        flex: 1,
        backgroundColor: '#F3F4F6',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        <Header
          onMenuClick={() => setIsSidebarOpen(prev => !prev)}
          onNotificationsClick={() => setActiveItem('Notices')}
        />
        {renderContent()}
      </div>
    </div>
  );
};

export default UnifiedDashboard;