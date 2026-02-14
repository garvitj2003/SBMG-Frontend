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
  MessageSquare,
  Building
} from 'lucide-react';
import { useState } from 'react';
import swachLogo from '../../../assets/logos/swach.png';
import Header from '../../common/Header';
import VDODashboardContent from './VDODashboardContent';
import VDOComplaintsContent from './VDOComplaintsContent';
import VDOAttendanceContent from './VDOAttendanceContent';
import VDOInspectionContent from './VDOInspectionContent';
import VDOVillageMasterContent from './VDOVillageMasterContent';
import VDOSchemesContent from './VDOSchemesContent';
import VDOEventsContent from './VDOEventsContent';
import VDONoticeContent from './VDONoticeContent';
import VDOGpsTrackingContent from './VDOGpsTrackingContent';
import PaymentsContent from '../PaymentsContent';
import VDOFeedbackContent from './VDOFeedback';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import VDOContractorDetails from './VDOContractorDetails';

const Sidebar = ({ activeItem, setActiveItem }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Complaints', icon: FileText },
    { name: 'Attendance', icon: CheckCircle },
    { name: 'Inspection', icon: ListChecks },
    { name: 'GP Master Data', icon: Database },
    { name: 'Contractor Details', icon: Building },
    { name: 'Schemes', icon: Briefcase },
    { name: 'Events', icon: Calendar },
    { name: 'GPS Tracking', icon: Truck },
    { name: 'Payments', icon: CreditCard },
    { name: 'Notices', icon: Bell },
    { name: 'Feedbacks', icon: MessageSquare }
  ];

 return (
    <aside className="w-full md:w-64 lg:w-[272px] h-screen bg-green-50 border-r border-gray-200 flex flex-col m-0 p-0" style={{
      width: '272px',
      height: '100vh',
      backgroundColor: '#F0FDF4',
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
                    backgroundColor: isActive ? '#009B56' : 'transparent',
                    color: isActive ? 'white' : '#374151',
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

const UnifiedDashboardVDO = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const vdoLocation = useVDOLocation();
  
  // Show loading screen while VDO data is being fetched
  if (!vdoLocation || vdoLocation.loadingVDOData || !vdoLocation.vdoDistrictId || !vdoLocation.vdoBlockId || !vdoLocation.vdoGPId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#F3F4F6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #059669',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading VDO Dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        return <VDODashboardContent />;
      case 'Complaints':
        return <VDOComplaintsContent />;
      case 'Attendance':
        return <VDOAttendanceContent />;
      case 'Inspection':
        return <VDOInspectionContent />;
      case 'GP Master Data':
        return <VDOVillageMasterContent />;
      case 'Contractor Details':
        return <VDOContractorDetails />;
      case 'Schemes':
        return <VDOSchemesContent />;
      case 'Events':
        return <VDOEventsContent />;
      case 'GPS Tracking':
        return <VDOGpsTrackingContent />;
      case 'Payments':
        return <PaymentsContent />;
      case 'Notices':
        return <VDONoticeContent />;
      case 'Feedbacks':
        return <VDOFeedbackContent />;
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
    <div className="flex h-screen bg-white m-0 p-0" style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: 'white',
      margin: 0,
      padding: 0
    }}>
      <div className={`transition-all duration-250 ease-in-out flex-shrink-0 ${isSidebarOpen ? 'w-64 md:w-64 lg:w-[272px]' : 'w-0'} overflow-hidden`} style={{
        width: isSidebarOpen ? '272px' : '0px',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      </div>
      <div className="flex-1 bg-gray-100 m-0 p-0 flex flex-col overflow-auto" style={{
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
          showLocationSearch={false}
        />
        {renderContent()}
      </div>
    </div>
  );
};

export default UnifiedDashboardVDO;

