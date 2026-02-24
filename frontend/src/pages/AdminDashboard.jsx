import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ChatWidget from '../components/ChatWidget';
import { Search, Filter, X, FileText, PieChart, Table } from 'lucide-react';
import AdminVisualizations from '../components/AdminVisualizations';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showVisualizations, setShowVisualizations] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);

    // Employee Modal State
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedEmployeeGrade, setSelectedEmployeeGrade] = useState(1);
    const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState('');

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterUser, setFilterUser] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Categories for filter
    const categories = ['Food', 'Travel', 'Supplies', 'Other'];

    // Filter Logic
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch =
            expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.amount.toString().includes(searchTerm) ||
            (expense.owner?.full_name && expense.owner.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (expense.status && expense.status.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
        const matchesStatus = filterStatus === 'All' || expense.status === filterStatus;
        const matchesUser = filterUser === 'All' || expense.owner?.email === filterUser;

        const expenseDate = new Date(expense.date).setHours(0, 0, 0, 0);
        const startDate = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : null;
        const endDate = dateRange.end ? new Date(dateRange.end).setHours(0, 0, 0, 0) : null;

        const matchesDate = (!startDate || expenseDate >= startDate) &&
            (!endDate || expenseDate <= endDate);

        const matchesAmount = (!amountRange.min || expense.amount >= parseFloat(amountRange.min)) &&
            (!amountRange.max || expense.amount <= parseFloat(amountRange.max));

        return matchesSearch && matchesCategory && matchesStatus && matchesUser && matchesDate && matchesAmount;
    });

    // Unique Users for Admin Filter
    const uniqueUsers = expenses
        .map(e => e.owner)
        .filter((obj, index, self) =>
            obj && index === self.findIndex((t) => (t.email === obj.email))
        );

    // Pagination calculations based on filtered results
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        fetchExpenses();
        fetchEmployees();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus, filterUser, dateRange, amountRange]);

    const fetchExpenses = async () => {
        try {
            const res = await axios.get('/api/expenses/');
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/users/');
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEmployeeSelect = (idStr) => {
        setSelectedEmployeeId(idStr);
        const emp = employees.find(e => e.id.toString() === idStr);
        if (emp) {
            setSelectedEmployeeGrade(emp.grade);
            setSelectedEmployeeEmail(emp.email);
        }
    };

    const submitGradeUpdate = async () => {
        if (!selectedEmployeeId) return;
        try {
            await axios.put(`/api/users/${selectedEmployeeId}/grade`, {
                grade: selectedEmployeeGrade,
                email: selectedEmployeeEmail
            });
            showToast('Employee updated successfully!', 'success');
            setShowEmployeeModal(false);
            fetchEmployees(); // refresh list
        } catch (err) {
            console.error("Failed to update employee", err);
            showToast(err.response?.data?.detail || 'Failed to update employee.', 'error');
        }
    };



    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wide">Admin Mode</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mt-1">Global Dashboard</h1>
                        <p className="text-gray-500">Overview of all company expenses</p>
                    </div>
                </div>

                {/* Main Content Area - Full Width No Cards */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Filters Section */}
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">

                        {/* Left Side: Visualization & Employees Button */}
                        <div className="flex w-full md:w-auto justify-start gap-3">
                            <button
                                onClick={() => setShowVisualizations(!showVisualizations)}
                                className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 shadow-sm ${showVisualizations ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-gray-600'}`}
                                title={showVisualizations ? "Show Table" : "Dashboard Visualization"}
                            >
                                {showVisualizations ? <Table size={20} /> : <PieChart size={20} />}
                                <span className="hidden md:inline font-medium">
                                    {showVisualizations ? 'Table View' : 'Dashboard Visualization'}
                                </span>
                            </button>
                            <button
                                onClick={() => setShowEmployeeModal(true)}
                                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-gray-600 transition-all flex items-center gap-2 shadow-sm"
                                title="Manage Employees"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                <span className="hidden md:inline font-medium">Employees</span>
                            </button>
                        </div>

                        {/* Right Side: Search & Filter */}
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            {!showVisualizations && (
                                <div className="relative flex-1 md:w-64 animate-fade-in">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search all expenses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className={`p-2 rounded-xl border transition-colors flex items-center gap-2 ${filterCategory !== 'All' || filterUser !== 'All' || dateRange.start || dateRange.end || amountRange.min || amountRange.max
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                    }`}
                                title="Filters"
                            >
                                <Filter size={20} />
                                <span className="hidden md:inline font-medium">Filters</span>
                            </button>
                        </div>
                    </div>


                    {showVisualizations ? (
                        <div className="p-6 bg-gray-50/30">
                            <AdminVisualizations expenses={filteredExpenses} />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>

                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {currentExpenses.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{expense.owner?.full_name || 'Unknown'}</span>
                                                        <span className="text-xs text-gray-400">{expense.owner?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${expense.category === 'Food' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        expense.category === 'Travel' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            'bg-gray-50 text-gray-700 border-gray-100'
                                                        }`}>
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {expense.description}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    ₹{expense.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${expense.status === 'Approved' ? 'bg-green-50 text-green-700' :
                                                        expense.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                                                            'bg-yellow-50 text-yellow-700'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${expense.status === 'Approved' ? 'bg-green-500' :
                                                            expense.status === 'Rejected' ? 'bg-red-500' :
                                                                'bg-yellow-500'
                                                            }`}></span>
                                                        {expense.status}
                                                    </span>
                                                </td>

                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <FileText className="h-8 w-8 text-gray-300" />
                                                    </div>
                                                    <p className="text-gray-900 font-medium">No expenses found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-100">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                        }`}
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(Math.max(1, totalPages))].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => paginate(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === Math.max(1, totalPages)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === Math.max(1, totalPages)
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </div>


                {/* Filter Modal */}
                {showFilterModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-scale-in">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Filter size={20} className="text-indigo-600" />
                                    Filter Expenses
                                </h3>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Category and Status Filters */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                        >
                                            <option value="All">All Categories</option>
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                {/* User Filter (Admin Only - Always true here) */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Employee</label>
                                    <select
                                        value={filterUser}
                                        onChange={(e) => setFilterUser(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                    >
                                        <option value="All">All Employees</option>
                                        {uniqueUsers.map(u => (
                                            <option key={u.email} value={u.email}>
                                                {u.full_name} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Range Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Date Range</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm"
                                        />
                                        <span className="text-gray-400">to</span>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Amount Range Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Amount Range (₹)</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            placeholder="Min ₹"
                                            value={amountRange.min}
                                            onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm"
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="number"
                                            placeholder="Max ₹"
                                            value={amountRange.max}
                                            onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setFilterCategory('All');
                                        setFilterStatus('All');
                                        setFilterUser('All');
                                        setDateRange({ start: '', end: '' });
                                        setAmountRange({ min: '', max: '' });
                                    }}
                                    className="px-4 py-2 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm font-medium transition-all"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold transition-all transform active:scale-95"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Employee Management Modal */}
                {showEmployeeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-scale-in">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    Manage Employees
                                </h3>
                                <button
                                    onClick={() => setShowEmployeeModal(false)}
                                    className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Employee</label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                    >
                                        <option value="" disabled>Select an employee</option>
                                        {employees
                                            .filter(emp => emp.full_name !== 'System Administrator')
                                            .map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.full_name || 'Unknown'}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {selectedEmployeeId && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={selectedEmployeeEmail}
                                                onChange={(e) => setSelectedEmployeeEmail(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                                placeholder="Employee Email"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Grade Level</label>
                                            <select
                                                value={selectedEmployeeGrade}
                                                onChange={(e) => setSelectedEmployeeGrade(Number(e.target.value))}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                            >
                                                {[...Array(10)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowEmployeeModal(false)}
                                    className="px-4 py-2 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitGradeUpdate}
                                    disabled={!selectedEmployeeId}
                                    className={`px-6 py-2 rounded-xl shadow-lg font-bold transition-all transform active:scale-95 ${!selectedEmployeeId ? 'bg-indigo-300 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <ChatWidget />
            </div>
        </div>
    );
};

export default AdminDashboard;
