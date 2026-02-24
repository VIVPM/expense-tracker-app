import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User, UserCog } from 'lucide-react';
import ProfileModal from './ProfileModal';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                E
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                ExpenseFlow
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                            <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600">
                                <User size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-700 leading-tight">{user?.full_name}</span>
                                <span className="text-[10px] text-gray-500 leading-tight">Grade {user?.grade}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                            title="Edit Profile"
                        >
                            <UserCog size={20} />
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </nav>
    );
};
export default Navbar;
