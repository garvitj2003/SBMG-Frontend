# SBMG Web - Role-Based Admin Dashboard

A modern, role-based admin dashboard built with React, Vite, and Tailwind CSS. This application provides different dashboards and features for three user roles: CEO, BDO (Block Development Officer), and VDO (Village Development Officer).

## 🚀 Features

### Role-Based Access Control
- **CEO Dashboard**: Executive-level analytics with revenue trends, department performance, and strategic metrics
- **BDO Dashboard**: Block-level analytics with village metrics, scheme monitoring, and beneficiary data
- **VDO Dashboard**: Village-level data with local schemes, beneficiary management, and daily activities

### Key Components
- 📊 **Interactive Charts**: Built with Recharts for real-time data visualization
- 🎨 **Modern UI**: Styled with Tailwind CSS for a beautiful, responsive interface
- 🔐 **Authentication**: Secure login system with role-based routing
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 📋 Tech Stack

- **Frontend Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.15
- **Charts**: Recharts 3.3.0
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sbmgweb
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## 🔑 Demo Credentials

The application is set up with demo authentication. Use the following credentials:

- **Password**: `demo123` (works for all roles)
- **Name**: Any name
- **Roles Available**:
  - CEO (Chief Executive Officer)
  - BDO (Block Development Officer)
  - VDO (Village Development Officer)

## 🗺️ Google Maps Setup

For GPS tracking features to work, you need to configure Google Maps API:

1. Create a `.env` file in the root directory:
```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

2. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Maps JavaScript API"
   - Enable "Maps Embed API" (optional)
   - Add HTTP referrer restrictions for security

3. For production deployment:
   - **GitHub Actions**: Add `VITE_GOOGLE_MAPS_API_KEY` as a secret in your repository settings
   - **Vercel**: Add the environment variable in your project settings

## 📁 Project Structure

```
src/
├── components/
│   ├── common/           # Reusable components
│   │   ├── Card.jsx      # Metric card component
│   │   ├── Header.jsx    # Dashboard header
│   │   └── Sidebar.jsx   # Navigation sidebar
│   └── dashboards/       # Role-specific dashboards
│       ├── CEODashboard.jsx
│       ├── BDODashboard.jsx
│       └── VDODashboard.jsx
├── context/
│   └── AuthContext.jsx   # Authentication context
├── pages/
│   ├── Login.jsx         # Login page
│   └── Dashboard.jsx     # Main dashboard container
├── services/
│   └── api.js            # API configuration
├── utils/
│   └── roleConfig.js     # Role-based configuration
├── App.jsx               # Main app component
└── main.jsx              # Entry point
```

## 🎯 Key Features by Role

### CEO Dashboard
- Total revenue and growth metrics
- Department performance analysis
- Project status distribution
- Revenue and profit trends
- Strategic KPIs

### BDO Dashboard
- Village-wise statistics
- Scheme progress tracking
- Beneficiary growth trends
- Block-level analytics
- Multi-village management

### VDO Dashboard
- Daily activity tracking
- Village household data
- Scheme-wise beneficiaries
- Weekly progress trends
- Field activity management

## 🔧 Configuration

### API Configuration
Update the API base URL in `src/services/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

### Role Configuration
Customize role features in `src/utils/roleConfig.js`:
- Dashboard titles
- Available features
- Menu items
- Color schemes

## 📊 Data Integration

Currently, the application uses mock data for demonstration. To integrate with a real backend:

1. Update the API endpoints in `src/services/api.js`
2. Modify the `useEffect` hooks in dashboard components to fetch real data
3. Update the authentication logic in `src/pages/Login.jsx`

Example API integration:
```javascript
import { dashboardAPI } from '../services/api';

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await dashboardAPI.getCEOData();
      setRevenueData(response.data.revenue);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  fetchData();
}, []);
```

## 🚀 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Customization

### Colors
Each role has a unique color scheme defined in `roleConfig.js`:
- CEO: Blue (#1e40af)
- BDO: Green (#15803d)
- VDO: Purple (#9333ea)

### Charts
Charts can be customized in individual dashboard components. Recharts provides extensive customization options.

## 📱 Responsive Design

The dashboard is fully responsive and adapts to different screen sizes:
- Mobile: Single column layout
- Tablet: 2-column grid
- Desktop: 4-column grid for metrics

## 🔐 Security Notes

⚠️ **Important**: The current implementation uses demo authentication. For production:

1. Implement proper backend authentication
2. Use secure token storage (httpOnly cookies recommended)
3. Add CSRF protection
4. Implement proper session management
5. Add input validation and sanitization

## 📝 License

This project is private and proprietary.

## 👥 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using React + Vite + Tailwind CSS
