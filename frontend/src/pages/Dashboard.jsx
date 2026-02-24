import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ChatWidget from '../components/ChatWidget';
import AdminDashboard from './AdminDashboard';
import { Plus, Trash2, FileText, X, Pencil, Search, Filter } from 'lucide-react';


const getBudget = (grade) => {
    const budgets = {
        1: 100, 2: 200, 3: 300, 4: 400, 5: 500,
        6: 600, 7: 700, 8: 800, 9: 900, 10: 1000
    };
    return budgets[grade] || 300;
};

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    // If Admin, render Admin Dashboard
    if (user?.grade === 0) {
        return <AdminDashboard />;
    }

    const { showToast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [categories, setCategories] = useState(['Food', 'Travel', 'Supplies', 'Other']);
    const [customCategory, setCustomCategory] = useState('');
    const [formData, setFormData] = useState({
        amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState('');
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [dashboardCategory, setDashboardCategory] = useState('Food');

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter Logic
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch =
            expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.amount.toString().includes(searchTerm) ||
            (expense.status && expense.status.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
        const matchesStatus = filterStatus === 'All' || expense.status === filterStatus;

        const expenseDate = new Date(expense.date).setHours(0, 0, 0, 0);
        const startDate = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : null;
        const endDate = dateRange.end ? new Date(dateRange.end).setHours(0, 0, 0, 0) : null;

        const matchesDate = (!startDate || expenseDate >= startDate) &&
            (!endDate || expenseDate <= endDate);

        const matchesAmount = (!amountRange.min || expense.amount >= parseFloat(amountRange.min)) &&
            (!amountRange.max || expense.amount <= parseFloat(amountRange.max));

        return matchesSearch && matchesCategory && matchesStatus && matchesDate && matchesAmount;
    });

    // Pagination calculations based on filtered results
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        fetchExpenses();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus, dateRange, amountRange]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        let finalCategory = formData.category;
        if (formData.category === 'Other') {
            if (!customCategory.trim()) {
                setError('Please specify the category');
                return;
            }
            finalCategory = customCategory.trim();
        }

        try {

            // Update categories list if new category
            if (formData.category === 'Other' && !categories.includes(finalCategory)) {
                setCategories(prev => {
                    const newCats = prev.filter(c => c !== 'Other');
                    return [...newCats, finalCategory, 'Other'];
                });
            }

            if (editingExpenseId) {
                await axios.put(`/api/expenses/${editingExpenseId}`, {
                    ...formData,
                    category: finalCategory,
                    amount: parseFloat(formData.amount),
                    date: formData.date
                });
                setEditingExpenseId(null);
                showToast('Expense updated successfully!');
            } else {
                await axios.post('/api/expenses/', {
                    ...formData,
                    category: finalCategory,
                    amount: parseFloat(formData.amount),
                    date: formData.date === new Date().toISOString().split('T')[0] ? new Date().toISOString() : new Date(formData.date).toISOString()
                });
                showToast('Expense added successfully!');
            }

            setShowForm(false);
            setFormData({
                amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0]
            });
            setCustomCategory('');
            fetchExpenses();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save expense');
        }
    };

    const handleDeleteClick = (id) => {
        setExpenseToDelete(id);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await axios.delete(`/api/expenses/${expenseToDelete}`);
            setExpenseToDelete(null);
            showToast('Expense deleted successfully!');
            fetchExpenses();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (expense) => {
        setFormData({
            amount: expense.amount,
            category: categories.includes(expense.category) ? expense.category : 'Other',
            description: expense.description,
            date: expense.date.split('T')[0]
        });
        if (!categories.includes(expense.category)) {
            setCustomCategory(expense.category);
        }
        setEditingExpenseId(expense.id);
        setShowForm(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-500">Welcome back, {user?.full_name}</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95 text-sm font-medium"
                    >
                        <Plus size={18} />
                        <span>Add New Expense</span>
                    </button>
                </div>



                {/* Stats Cards */}
                {(() => {
                    const today = new Date().toLocaleDateString('en-CA'); // strict format YYYY-MM-DD
                    const dailyLimit = getBudget(user?.grade);

                    // Default to 'All' or specific category? User implies 'All' should work but limits are per category.
                    // Let's use the state we just added (need to add state first).
                    // Wait, I can't add state inside this block. I need to add state to the component body.
                    // I will do that in a separate edit. For now, let's assume 'dashboardCategory' exists.

                    const currentCategoryExpenses = expenses
                        .filter(e => (dashboardCategory === 'All' || e.category === dashboardCategory) && e.date.startsWith(today) && e.status === 'Approved')
                        .reduce((acc, curr) => acc + curr.amount, 0);

                    const remaining = dashboardCategory === 'All'
                        ? 'Select Category'
                        : (dailyLimit - currentCategoryExpenses).toFixed(2);

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 card-hover relative group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Spent Today</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            ₹{currentCategoryExpenses.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <FileText size={24} />
                                        </div>
                                        <select
                                            value={dashboardCategory}
                                            onChange={(e) => setDashboardCategory(e.target.value)}
                                            className="text-xs border-none bg-gray-50 rounded-lg px-2 py-1 text-gray-600 font-medium focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <option value="All">All Items</option>
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 card-hover">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Transactions Today</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {expenses.filter(e => (dashboardCategory === 'All' || e.category === dashboardCategory) && e.date.startsWith(today)).length}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <FileText size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 card-hover">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Remaining Amount</p>
                                        <p className={`text-3xl font-bold mt-2 ${dashboardCategory !== 'All' && parseFloat(remaining) < 0 ? 'text-red-500' :
                                            dashboardCategory !== 'All' && parseFloat(remaining) < dailyLimit * 0.05 ? 'text-amber-500' : 'text-gray-900'
                                            }`}>
                                            {dashboardCategory === 'All' ? '-' : `₹${remaining}`}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-lg ${dashboardCategory !== 'All' && parseFloat(remaining) < 0 ? 'bg-red-50 text-red-600' :
                                        dashboardCategory !== 'All' && parseFloat(remaining) < dailyLimit * 0.05 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                        <FileText size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 card-hover">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Daily Limit</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            ₹{dailyLimit.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                                        <FileText size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Filters Section */}
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-end items-center gap-4">
                        {/* Search Bar & Filter Button */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search expenses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className={`p-2 rounded-xl border transition-colors flex items-center gap-2 ${filterCategory !== 'All' || dateRange.start || dateRange.end || amountRange.min || amountRange.max
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


                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(expense.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-medium">No expenses yet</p>
                                            <p className="text-sm mt-1">Start by adding your first expense</p>
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
                </div>

            </div>

            {/* Add Expense Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900">{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h3>
                            <button
                                onClick={() => { setShowForm(false); setEditingExpenseId(null); }}
                                className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">₹</span>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 pl-10 pr-4 border bg-gray-50 focus:bg-white transition-all text-lg font-medium"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border bg-gray-50 focus:bg-white transition-all"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                {/* Daily Limit Warning */}
                                {(() => {
                                    const dailyLimit = getBudget(user?.grade);
                                    const today = new Date().toISOString().split('T')[0];
                                    const categoryExpenses = expenses
                                        .filter(e => e.category === (formData.category === 'Other' ? customCategory : formData.category) && e.date.startsWith(today) && e.status === 'Approved')
                                        .reduce((acc, curr) => acc + curr.amount, 0);

                                    const remaining = dailyLimit - categoryExpenses;
                                    const warningThreshold = dailyLimit * 0.15; // 15%

                                    if (remaining <= warningThreshold && remaining > 0) {
                                        return (
                                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 animate-pulse">
                                                <div className="p-1 bg-amber-100 rounded-full mt-0.5">
                                                    <FileText size={14} className="text-amber-600" />
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-bold">Daily Cap Warning</p>
                                                    <p>Only ₹{remaining.toFixed(2)} remaining for {formData.category} today!</p>
                                                </div>
                                            </div>
                                        );
                                    } else if (remaining <= 0) {
                                        return (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900">
                                                <div className="p-1 bg-red-100 rounded-full mt-0.5">
                                                    <X size={14} className="text-red-600" />
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-bold">Daily Cap Exceeded</p>
                                                    <p>You have used your entire daily limit of ₹{dailyLimit} for {formData.category}.</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {formData.category === 'Other' && (
                                    <div className="mt-3 animate-fade-in-down">
                                        <input
                                            required
                                            type="text"
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border bg-white transition-all"
                                            placeholder="Enter new category name..."
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border bg-gray-50 focus:bg-white transition-all resize-none"
                                    placeholder="What was this expense for?"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-5 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-colors border border-transparent hover:border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-200 font-bold transition-all transform active:scale-95"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {expenseToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-scale-in">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Expense?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete this expense? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setExpenseToDelete(null)}
                                    className="flex-1 px-5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 font-bold transition-colors border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-200 font-bold transition-all transform active:scale-95"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
                            {/* Category Filter */}
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
            <ChatWidget />
        </div>
    );
};
export default Dashboard;
