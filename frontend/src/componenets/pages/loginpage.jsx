import  { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthProvider } from './services/context/authprovider';
import { useAuth } from './services/context/useauth';
import API from '../pages/services/api';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
        const response = await API.post('/api/auth/login', credentials);
        
        console.log("Successful Login Data:", response.data);

        if (response.data) {
            const user = response.data;
            login(user); 

            // 2. Perform conditional navigation right here based on the Role Enum string
            if (user.role === 'RESEARCHER') {
                navigate('/RDashboard'); 
            }
            else if (user.role === 'LAB_TECHNICIAN') {
                navigate('/LTDashboard'); 
            }
             else if (user.role === 'LAB_MANAGER') {
                navigate('/LMDashboard'); 
            }
            else if (user.role === 'DEPARTMENT_HEAD') {
                navigate('/Ddashboard'); 
            }
            else if (user.role === 'INSTITUTION_ADMIN') {
                navigate('/IDashboard'); 
            }
            else if (user.role === 'SYSTEM_ADMIN') {
                navigate('/SDashboard'); 
            }
            else {
                navigate('/login'); // add elsSend Lab Managers, Admins, Technicians, etc., to a standard dashboard
            }
            
        } else {
            setError("Invalid backend response payload layout.");
        }

        } catch (err) {
            console.error("Login submission failure:", err);
            setError(err.response?.data?.message || 'Invalid email or password');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-md">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
                </div>
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input name="email" type="email" required onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input name="password" type="password" required onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"/>
                        </div>
                    </div>

                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Sign In
                    </button>
                </form>
                <div className="text-center text-sm">
                  Don't have an account?   <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">Sign up</Link>
                </div>
            </div>
        </div>
    );
}