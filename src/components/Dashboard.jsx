import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { QrCodeIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { formatTimestamp, calculateQRMetrics } from '../lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalWorkers: 0,
    totalQRCodes: 0,
    totalScans: 0
  });
  const [qrMetrics, setQrMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchQRMetrics();
  }, []);

  async function fetchStats() {
    try {
      const { count: workersCount } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true });

      const { count: qrCodesCount } = await supabase
        .from('qr_codes')
        .select('*', { count: 'exact', head: true });

      const { data: scanData } = await supabase
        .from('workers')
        .select('visits_count');

      const totalScans = scanData?.reduce((acc, curr) => acc + curr.visits_count, 0) || 0;

      setStats({
        totalWorkers: workersCount || 0,
        totalQRCodes: qrCodesCount || 0,
        totalScans
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchQRMetrics() {
    try {
      const { data: qrCodes } = await supabase
        .from('qr_codes')
        .select('*')
        .order('created_at', { ascending: true });

      if (qrCodes) {
        const metrics = calculateQRMetrics(qrCodes);
        setQrMetrics(metrics);

        // Prepare chart data
        const dates = qrCodes.map(qr => formatTimestamp(qr.created_at));
        const scans = qrCodes.map(qr => qr.scan_count || 0);

        setChartData({
          labels: dates,
          datasets: [
            {
              label: 'QR Code Scans',
              data: scans,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching QR metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Feature Highlights */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-700">New Features Available!</h2>
        <ul className="mt-2 space-y-1 text-blue-600">
          <li>• Enhanced QR Code Generation with custom colors and sizes</li>
          <li>• Real-time QR code preview with zoom capabilities</li>
          <li>• Improved worker management system</li>
          <li>• Detailed analytics and statistics</li>
        </ul>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Workers
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.totalWorkers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <QrCodeIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total QR Codes
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.totalQRCodes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Scans
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.totalScans}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Metrics */}
      {qrMetrics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">QR Code Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Success Rate</p>
              <p className="text-2xl font-bold text-blue-700">
                {qrMetrics.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Total Generated</p>
              <p className="text-2xl font-bold text-green-700">
                {qrMetrics.totalGenerated}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">Avg. Generation Time</p>
              <p className="text-2xl font-bold text-purple-700">
                {qrMetrics.averageGenerationTime.toFixed(2)}ms
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Error Rate</p>
              <p className="text-2xl font-bold text-red-700">
                {qrMetrics.errorRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Chart */}
      {chartData && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">QR Code Usage Over Time</h3>
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'QR Code Scan History'
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      
    </div>
  );
}

export default Dashboard;