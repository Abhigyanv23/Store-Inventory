import { Package, DollarSign, TrendingDown, Box } from 'lucide-react';
import './DashboardStats.css'; // Renamed CSS import

// Helper component for individual stat cards
function StatCard({ icon, title, value, color }) {
  const IconComponent = icon;
  return (
    <div className="stat-card">
      <div className={`icon-wrapper ${color}`}>
        <IconComponent className="icon" />
      </div>
      <div className="stat-info">
        <p>{title}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}

function DashboardStats({ stats }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  return (
    <div className="dashboard-grid">
      <StatCard
        icon={Package}
        title="Total Products"
        value={stats.totalProducts || 0}
        color="bg-indigo"
      />
      <StatCard
        icon={DollarSign}
        title="Total Stock Value"
        value={formatCurrency(stats.totalValue)}
        color="bg-green"
      />
      <StatCard
        icon={TrendingDown}
        title="Low Stock Items"
        value={stats.lowStockItems || 0}
        color="bg-yellow"
      />
      <StatCard
        icon={Box}
        title="Out of Stock Items"
        value={stats.outOfStockItems || 0}
        color="bg-red"
      />
    </div>
  );
}

export default DashboardStats;
