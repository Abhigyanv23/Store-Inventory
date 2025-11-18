import React, { useState, useEffect } from 'react';
import api from '../api'; 
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardCharts.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

// UPDATED: Accept dateRange as a prop
function DashboardCharts({ dateRange }) {
  const [categoryData, setCategoryData] = useState([]);
  const [valueData, setValueData] = useState([]);
  const [error, setError] = useState(null);

  // UPDATED: This effect will now re-run whenever dateRange changes
  useEffect(() => {
    const fetchData = async () => {
      setError(null); // Clear previous errors
      try {
        // Prepare query parameters
        const params = {
          // Send null if date is null, otherwise send ISO string
          startDate: dateRange[0] ? dateRange[0].toISOString() : null,
          endDate: dateRange[1] ? dateRange[1].toISOString() : null,
        };

        const [catRes, valRes] = await Promise.all([
          api.get(`/dashboard/category-chart`, { params }), // <-- Pass params
          api.get(`/dashboard/value-chart`, { params })     // <-- Pass params
        ]);
        
        const formattedCategoryData = catRes.data.map(item => ({
          name: item.category,
          value: item.value
        }));

        setCategoryData(formattedCategoryData);
        setValueData(valRes.data);

      } catch (err) {
        console.error("Error fetching chart data", err);
        setError("Could not load charts.");
      }
    };
    fetchData();
  }, [dateRange]); // <-- Add dateRange as a dependency

  if (error) {
    return <div className="charts-container error-message">{error}</div>;
  }
  
  return (
    <div className="charts-container">
      <div className="chart-wrapper">
        <h3>Products by Category</h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : <p>No category data found for this period.</p>}
      </div>

      <div className="chart-wrapper">
        <h3>Top 5 Products by Stock Value</h3>
        {valueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p>No product value data found for this period.</p>}
      </div>
    </div>
  );
}

export default DashboardCharts;
