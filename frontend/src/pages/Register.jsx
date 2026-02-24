import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const { register } = useContext(AuthContext);
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        email: '', password: '', full_name: '', grade: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData.email, formData.password, formData.full_name, parseInt(formData.grade));
            showToast('Account created successfully! Welcome to ExpenseFlow 🎉');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-3xl"></div>
            </div>

            <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 z-10 relative">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4">
                        E
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
                    <p className="mt-2 text-sm text-gray-500">Join ExpenseFlow today</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Full Name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <select
                                required
                                className={`appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${formData.grade === '' ? 'text-gray-400' : 'text-gray-900'
                                    }`}
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            >
                                <option value="" disabled>Select Employee Grade</option>
                                {[...Array(10)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <input
                                type="email"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-[26px] -translate-y-1/2 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs font-semibold text-gray-500">Password must contain:</p>
                                    <ul className="text-xs space-y-1 text-gray-500">
                                        <li className={formData.password.length >= 6 ? "text-green-600 flex items-center" : "flex items-center"}>
                                            <span className="mr-1">{formData.password.length >= 6 ? "✓" : "○"}</span> At least 6 characters
                                        </li>
                                        <li className={/[A-Z]/.test(formData.password) ? "text-green-600 flex items-center" : "flex items-center"}>
                                            <span className="mr-1">{/[A-Z]/.test(formData.password) ? "✓" : "○"}</span> One uppercase letter
                                        </li>
                                        <li className={/[a-z]/.test(formData.password) ? "text-green-600 flex items-center" : "flex items-center"}>
                                            <span className="mr-1">{/[a-z]/.test(formData.password) ? "✓" : "○"}</span> One lowercase letter
                                        </li>
                                        <li className={/[0-9]/.test(formData.password) ? "text-green-600 flex items-center" : "flex items-center"}>
                                            <span className="mr-1">{/[0-9]/.test(formData.password) ? "✓" : "○"}</span> One number
                                        </li>
                                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "text-green-600 flex items-center" : "flex items-center"}>
                                            <span className="mr-1">{/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "✓" : "○"}</span> One special character
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={
                                formData.password.length < 6 ||
                                !/[A-Z]/.test(formData.password) ||
                                !/[a-z]/.test(formData.password) ||
                                !/[0-9]/.test(formData.password) ||
                                !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                            }
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sign up
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default Register;
