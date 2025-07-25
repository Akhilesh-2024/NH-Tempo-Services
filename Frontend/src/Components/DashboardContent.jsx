import React from 'react';
import { useSelector } from 'react-redux';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaTruck, 
  FaMoneyBillWave, 
  FaExclamationTriangle,
  FaChartLine,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaSync
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';

const DashboardContent = ({ setActiveTab }) => {
  const { stats, loading, error } = useSelector((state) => state.dashboard);
  const { updateAllData } = useRealTimeUpdates(2); // Update every 2 minutes

  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case 'Calendar':
        return FaCalendarAlt;
      case 'Users':
        return FaUsers;
      case 'Truck':
        return FaTruck;
      default:
        return FaCalendarAlt;
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, chart, onClick }) => (
    <div 
      className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300 hover:border-gray-600/50 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {trend.direction === 'up' ? (
              <FaArrowUp className="h-3 w-3 text-green-300" />
            ) : (
              <FaArrowDown className="h-3 w-3 text-red-300" />
            )}
            <span className={`text-sm font-medium ${trend.direction === 'up' ? 'text-green-300' : 'text-red-300'}`}>
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {chart && (
        <div className="h-20">
          {chart}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-center items-center">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            <button
              onClick={updateAllData}
              disabled={loading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
              title="Refresh data"
            >
              <FaSync className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-gray-300 text-center">Real-time overview of your tempo services business</p>
          {stats.lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          )}
          
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings.toLocaleString()}
            subtitle={`${stats.weeklyBookingsCount} this week`}
            icon={FaCalendarAlt}
            color="bg-blue-600"
            onClick={() => setActiveTab && setActiveTab('list-booking')}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.bookingChartData}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f90d9" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            }
          />
          
          <StatCard
            title="Total Parties"
            value={stats.totalParties.toLocaleString()}
            subtitle="Registered clients"
            icon={FaUsers}
            color="bg-green-600"
            onClick={() => setActiveTab && setActiveTab('list-party')}
          />
          
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles.toLocaleString()}
            subtitle="Active fleet"
            icon={FaTruck}
            color="bg-purple-600"
            onClick={() => setActiveTab && setActiveTab('list-vehicle')}
          />
          
          <StatCard
            title="Total Revenue"
            value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`}
            subtitle={`₹${(stats.monthlyRevenue / 1000).toFixed(0)}K this month`}
            icon={FaMoneyBillWave}
            color="bg-orange-600"
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueChartData}>
                  <Bar dataKey="value" fill="#ea7a28" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          />
        </div>

        {/* Pending Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Pending Deliveries"
            value={stats.pendingDeliveries}
            subtitle="Awaiting completion"
            icon={FaExclamationTriangle}
            color="bg-yellow-600"
            onClick={() => setActiveTab && setActiveTab('delivery-pending')}
          />
          
          <StatCard
            title="Pending Party Payments"
            value={stats.pendingPartyPayments}
            subtitle="Outstanding receivables"
            icon={FaHourglassHalf}
            color="bg-red-600"
            onClick={() => setActiveTab && setActiveTab('party-pending')}
          />
          
          <StatCard
            title="Pending Vehicle Payments"
            value={stats.pendingVehiclePayments}
            subtitle="Outstanding payables"
            icon={FaTimesCircle}
            color="bg-indigo-600"
            onClick={() => setActiveTab && setActiveTab('vehicle-pending')}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bookings Trend Chart */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-100">Weekly Bookings Trend</h2>
              <FaChartLine className="h-5 w-5 text-blue-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.bookingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4f90d9" 
                  strokeWidth={3}
                  dot={{ fill: '#4f90d9', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution Chart */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-100">Booking Status Distribution</h2>
              <FaCheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-100">Monthly Revenue Trend</h2>
            <FaMoneyBillWave className="h-5 w-5 text-orange-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="value" fill="#ea7a28" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-100">Recent Activities</h2>
            <FaClock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.recentActivities.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No recent activities</p>
            ) : (
              stats.recentActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.icon);
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 border border-gray-600/20">
                    <div className="p-2 rounded-full bg-gray-800">
                      <IconComponent className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-100">{activity.title}</p>
                      <p className="text-sm text-gray-400">{activity.description}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.time}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;