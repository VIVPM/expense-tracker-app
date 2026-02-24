import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../context/AuthContext';
import { X, User, Lock, Mail } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, refreshUser } = useContext(AuthContext);
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        full_name: '',
        password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                full_name: user.full_name || '',
                password: '',
                confirm_password: ''
            });
            setError('');
            setSuccess('');
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (formData.password && formData.password !== formData.confirm_password) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            const updateData = {
                full_name: formData.full_name
            };
            if (formData.password) {
                updateData.password = formData.password;
            }

            await axios.put('/api/users/me', updateData);
            await refreshUser();
            showToast('Profile updated successfully!');
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                            <User size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                        <p className="text-gray-500 text-sm mt-1">Update your personal details</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm py-2 px-3 rounded-lg text-center font-medium">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-600 text-sm py-2 px-3 rounded-lg text-center font-medium">
                                {success}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Grade</label>
                            <input
                                type="text"
                                value={`Grade ${user?.grade || ''}`}
                                disabled
                                className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1 ml-1">Grade cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 ml-1">Email cannot be changed</p>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                        </div>

                        {formData.password && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Confirm new password"
                                        required={!!formData.password}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
