import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './componenets/pages/services/context/authprovider';
import { useAuth } from './componenets/pages/services/context/useauth';
import Login from './componenets/pages/loginpage';
import Signup from './componenets/pages/signuppage';
import HomePage from './componenets/pages/homepage';

// 1. Unified Route Shield to verify authentication status
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user } = useAuth();
    
    // Not logged in at all -> Send to Login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Logged in, but trying to sneak into another role's dashboard path
    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const LabTechDashboard    = () => <div className="p-8"><h1 className="text-2xl font-bold text-emerald-600">⚙️ Lab Technician Panel</h1><DashboardMeta /></div>;
const LabManagerDashboard = () => <div className="p-8"><h1 className="text-2xl font-bold text-amber-600">📊 Lab Manager Control</h1><DashboardMeta /></div>;
const DeptHeadDashboard   = () => <div className="p-8"><h1 className="text-2xl font-bold text-sky-600">🏛️ Department Head Overview</h1><DashboardMeta /></div>;
const InstAdminDashboard  = () => <div className="p-8"><h1 className="text-2xl font-bold text-purple-600">🏢 Institution Admin Terminal</h1><DashboardMeta /></div>;
const SystemAdminDashboard = () => <div className="p-8"><h1 className="text-2xl font-bold text-rose-600">💻 System Admin Root Settings</h1><DashboardMeta /></div>;


function DashboardMeta() {
    const { user, logout } = useAuth();
    return (
        <div className="mt-4 text-sm text-gray-600 max-w-sm bg-gray-50 border p-4 rounded-xl">
            <p><strong>User:</strong> {user?.firstname} {user?.lastname}</p>
            <p><strong>Department:</strong> {user?.department}</p>
            <button onClick={logout} className="mt-4 px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold">Logout</button>
        </div>
    );
}

// 3. Main Route Switch Mapping Module Configuration
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routing Setup Options */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Role-Specific Paths matching your loginpage.jsx navigate() targets */}
                    <Route path="/RDashboard" element={
                        <ProtectedRoute allowedRole="RESEARCHER"><HomePage /></ProtectedRoute>
                    } />
                    <Route path="/LTDashboard" element={
                        <ProtectedRoute allowedRole="LAB_TECHNICIAN"><LabTechDashboard /></ProtectedRoute>
                    } />
                    <Route path="/LMDashboard" element={
                        <ProtectedRoute allowedRole="LAB_MANAGER"><LabManagerDashboard /></ProtectedRoute>
                    } />
                    <Route path="/Ddashboard" element={
                        <ProtectedRoute allowedRole="DEPARTMENT_HEAD"><DeptHeadDashboard /></ProtectedRoute>
                    } />
                    <Route path="/IDashboard" element={
                        <ProtectedRoute allowedRole="INSTITUTION_ADMIN"><InstAdminDashboard /></ProtectedRoute>
                    } />
                    <Route path="/SDashboard" element={
                        <ProtectedRoute allowedRole="SYSTEM_ADMIN"><SystemAdminDashboard /></ProtectedRoute>
                    } />

                    {/* Catch-all global tracking fallback */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}