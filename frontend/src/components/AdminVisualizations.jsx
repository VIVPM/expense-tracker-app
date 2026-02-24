import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];
const STATUS_COLORS = {
    'Approved': '#10b981', // green
    'Pending': '#f59e0b',  // amber
    'Rejected': '#ef4444'  // red
};

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

const Card = ({ title, children }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>
        <div className="flex-1 w-full relative min-h-[300px]">
            {children}
        </div>
    </div>
);

const AdminVisualizations = ({ expenses }) => {

    if (!expenses || expenses.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                Not enough data to generate visualizations.
            </div>
        );
    }

    // 1. Category Data
    const categoryMap = {};
    expenses.forEach(e => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const categoryData = Object.keys(categoryMap)
        .map(name => ({ name, value: parseFloat(categoryMap[name].toFixed(2)) }))
        .sort((a, b) => b.value - a.value);

    // 2. Status Data (by percentage of total amount)
    const statusMap = {};
    expenses.forEach(e => {
        statusMap[e.status] = (statusMap[e.status] || 0) + e.amount;
    });
    const totalStatusAmount = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const statusData = Object.keys(statusMap).map(name => ({
        name,
        value: totalStatusAmount > 0 ? parseFloat(((statusMap[name] / totalStatusAmount) * 100).toFixed(1)) : 0,
        isPercent: true
    }));

    // Data for Average Expense by Category
    const categoryCountMap = {};
    expenses.forEach(e => {
        categoryCountMap[e.category] = (categoryCountMap[e.category] || 0) + 1;
    });
    const avgCategoryData = Object.keys(categoryMap).map(name => ({
        name,
        amount: parseFloat((categoryMap[name] / categoryCountMap[name]).toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    // Data for Category-wise Limit Breaches (Pending = Breach)
    const breachMap = {};
    expenses.forEach(e => {
        if (e.status === 'Pending') {
            breachMap[e.category] = (breachMap[e.category] || 0) + 1;
        }
    });
    const breachData = Object.keys(breachMap).map(name => ({
        name,
        value: breachMap[name],
        isCount: true
    })).sort((a, b) => b.value - a.value);

    // 3. Time Data
    const timeMap = {};
    expenses.forEach(e => {
        const dateObj = new Date(e.date);
        const d = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        timeMap[d] = (timeMap[d] || 0) + e.amount;
    });
    const timeData = Object.keys(timeMap).sort().map(d => ({
        date: new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        amount: parseFloat(timeMap[d].toFixed(2))
    }));

    // 4. Grade Level — 3-step formula:
    // Step 1: For each employee, group expenses by category
    // Step 2: Avg per category → then avg those → one number per employee
    // Step 3: Avg all employee numbers per grade

    // employeeData: { email: { grade, categories: { Food: [100,100], Travel: [120] } } }
    const employeeData = {};
    expenses.forEach(e => {
        if (e.owner) {
            const email = e.owner.email;
            if (!employeeData[email]) {
                employeeData[email] = { grade: e.owner.grade, categories: {} };
            }
            const cat = e.category;
            if (!employeeData[email].categories[cat]) employeeData[email].categories[cat] = [];
            employeeData[email].categories[cat].push(e.amount);
        }
    });

    // Per employee: avg per category → avg of those avgs
    const gradeEmployeeAvgs = {}; // { "Grade 3": [110, 130] }
    Object.values(employeeData).forEach(({ grade, categories }) => {
        const label = `Grade ${grade}`;
        const catAvgs = Object.values(categories).map(
            amounts => amounts.reduce((a, b) => a + b, 0) / amounts.length
        );
        const employeeAvg = catAvgs.reduce((a, b) => a + b, 0) / catAvgs.length;
        if (!gradeEmployeeAvgs[label]) gradeEmployeeAvgs[label] = [];
        gradeEmployeeAvgs[label].push(employeeAvg);
    });

    // Per grade: avg of all employee avgs
    const gradeData = Object.keys(gradeEmployeeAvgs).map(g => ({
        name: g,
        gradeNum: parseInt(g.replace('Grade ', '')),
        amount: parseFloat(
            (gradeEmployeeAvgs[g].reduce((a, b) => a + b, 0) / gradeEmployeeAvgs[g].length).toFixed(2)
        )
    })).sort((a, b) => a.gradeNum - b.gradeNum);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            let displayValue = formatCurrency(payload[0].value);
            if (data.isPercent) {
                displayValue = `${payload[0].value}%`;
            } else if (data.isCount) {
                displayValue = `${payload[0].value} breaches`;
            }

            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                    <p className="font-bold text-gray-900 mb-1">{label || payload[0].name || data.name}</p>
                    <p className="text-indigo-600 font-semibold">{displayValue}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Row: 2 Graphs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expenses by Status */}
                <Card title="Expenses by Status">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="45%"
                                outerRadius={110}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                {/* Avg Spending by Grade Level */}
                <Card title="Avg Spending by Grade Level">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gradeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                            <YAxis tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Second Row: 2 Graphs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Average Expense by Category */}
                <Card title="Average Expense by Category">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={avgCategoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                            <YAxis tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Limit Breaches */}
                <Card title="Category-wise Limit Breaches">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={breachData}
                                cx="50%"
                                cy="45%"
                                outerRadius={110}
                                dataKey="value"
                            >
                                {breachData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Middle: 1 Graph */}
            <Card title="Spending Trends Over Time">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default AdminVisualizations;
