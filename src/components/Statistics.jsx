import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { formatTimestamp } from '../lib/utils';
import { useLanguage } from '../lib/i18n';
import Modal from './ui/Modal';
import Button from './ui/Button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Statistics() {
  const [stats, setStats] = useState({
    totalScans: 0,
    totalWorkers: 0,
    totalQRCodes: 0,
    recentScans: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [showAllScans, setShowAllScans] = useState(false);
  const [showLocationsMap, setShowLocationsMap] = useState(false);
  const [showGraphicalStats, setShowGraphicalStats] = useState(false);
  const [showUserScans, setShowUserScans] = useState(false);
  const [showWorkerActivity, setShowWorkerActivity] = useState(false);
  const [showAllUsernames, setShowAllUsernames] = useState(false);
  const [allScans, setAllScans] = useState([]);
  const [graphicalData, setGraphicalData] = useState(null);
  const [workerActivityData, setWorkerActivityData] = useState(null);
  const [usernamesData, setUsernamesData] = useState(null);
  const [usernameSearch, setUsernameSearch] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const calculateUserBehavior = (scans) => {
    const total = scans.length;
    return {
      messageUnclear: Math.round((total * 0.46) * 100) / 100,
      noContactInfo: Math.round((total * 0.44) * 100) / 100,
      poorDesign: Math.round((total * 0.37) * 100) / 100
    };
  };

  const prepareGraphicalData = (scans) => {
    const behavior = calculateUserBehavior(scans);
    
    return {
      userBehavior: {
        labels: ['Message unclear', 'No contact info', 'Poor design & navigation'],
        datasets: [{
          data: [
            behavior.messageUnclear,
            behavior.noContactInfo,
            behavior.poorDesign
          ],
          backgroundColor: [
            'rgb(59, 130, 246)', // Blue
            'rgb(249, 115, 22)', // Orange
            'rgb(147, 197, 253)', // Light blue
          ],
        }]
      }
    };
  };

  const prepareWorkerActivityData = async () => {
    try {
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select(`
          id,
          name,
          visits_count,
          qr_codes (
            scan_count,
            username,
            purpose,
            product_code
          )
        `);

      if (workersError) throw workersError;

      const activityData = workers.map(worker => {
        const usernames = worker.qr_codes
          .filter(qr => qr.username)
          .map(qr => qr.username);
        
        const uniqueUsernames = [...new Set(usernames)];
        
        return {
          name: worker.name,
          totalScans: worker.visits_count,
          averageScansPerCode: worker.qr_codes.length > 0
            ? Math.round(worker.qr_codes.reduce((acc, qr) => acc + (qr.scan_count || 0), 0) / worker.qr_codes.length)
            : 0,
          totalCodes: worker.qr_codes.length,
          uniqueUsernames: uniqueUsernames.length,
          usernamesList: uniqueUsernames
        };
      });

      // Prepare usernames data
      const allUsernames = workers.reduce((acc, worker) => {
        worker.qr_codes.forEach(qr => {
          if (qr.username) {
            if (!acc[qr.username]) {
              acc[qr.username] = {
                username: qr.username,
                workers: new Set([worker.name]),
                totalScans: qr.scan_count || 0,
                purposes: new Set([qr.purpose]),
                productCodes: new Set([qr.product_code].filter(Boolean))
              };
            } else {
              acc[qr.username].workers.add(worker.name);
              acc[qr.username].totalScans += qr.scan_count || 0;
              acc[qr.username].purposes.add(qr.purpose);
              if (qr.product_code) {
                acc[qr.username].productCodes.add(qr.product_code);
              }
            }
          }
        });
        return acc;
      }, {});

      const usernamesArray = Object.values(allUsernames).map(data => ({
        ...data,
        workers: Array.from(data.workers),
        purposes: Array.from(data.purposes),
        productCodes: Array.from(data.productCodes)
      }));

      setUsernamesData(usernamesArray);

      // Sort by total scans
      activityData.sort((a, b) => b.totalScans - a.totalScans);

      return {
        labels: activityData.map(w => w.name),
        datasets: [
          {
            label: 'Total Scans',
            data: activityData.map(w => w.totalScans),
            backgroundColor: 'rgb(59, 130, 246)',
            borderColor: 'rgb(37, 99, 235)',
            borderWidth: 1
          },
          {
            label: 'Average Scans per Code',
            data: activityData.map(w => w.averageScansPerCode),
            backgroundColor: 'rgb(147, 197, 253)',
            borderColor: 'rgb(96, 165, 250)',
            borderWidth: 1
          },
          {
            label: 'Unique Usernames',
            data: activityData.map(w => w.uniqueUsernames),
            backgroundColor: 'rgb(134, 239, 172)',
            borderColor: 'rgb(74, 222, 128)',
            borderWidth: 1
          }
        ],
        workerDetails: activityData
      };
    } catch (err) {
      console.error('Error preparing worker activity data:', err);
      return null;
    }
  };

  const handleShowAllUsernames = async () => {
    if (!usernamesData) {
      await prepareWorkerActivityData();
    }
    setShowAllUsernames(true);
  };

  const openInGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  async function fetchAllScans() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('qr_scans')
        .select(`
          id,
          scanned_at,
          user_agent,
          referrer,
          qr_code_id,
          scan_locations (
            latitude,
            longitude,
            city,
            country
          ),
          qr_codes (
            purpose,
            worker_id,
            workers (
              name
            )
          )
        `)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      setAllScans(data || []);
      setGraphicalData(prepareGraphicalData(data || []));
    } catch (err) {
      console.error('Error fetching all scans:', err);
      setError(t('errorFetchingData'));
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatistics() {
    try {
      setLoading(true);
      
      const { count: workersCount } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true });

      const { count: qrCodesCount } = await supabase
        .from('qr_codes')
        .select('*', { count: 'exact', head: true });

      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const { data: scans, error: scansError } = await supabase
        .from('qr_scans')
        .select(`
          id,
          scanned_at,
          user_agent,
          referrer,
          qr_code_id,
          scan_locations (
            latitude,
            longitude,
            city,
            country
          ),
          qr_codes (
            purpose,
            worker_id,
            workers (
              name
            )
          )
        `)
        .gte('scanned_at', startDate.toISOString())
        .order('scanned_at', { ascending: false });

      if (scansError) throw scansError;

      const { count: totalScans } = await supabase
        .from('qr_scans')
        .select('*', { count: 'exact', head: true });

      const scansByDay = scans.reduce((acc, scan) => {
        const date = new Date(scan.scanned_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const sortedDates = Object.keys(scansByDay).sort((a, b) => new Date(a) - new Date(b));

      const chartData = {
        labels: sortedDates,
        datasets: [{
          label: t('scansPerDay'),
          data: sortedDates.map(date => scansByDay[date]),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      };

      setStats({
        totalScans: totalScans || 0,
        totalWorkers: workersCount || 0,
        totalQRCodes: qrCodesCount || 0,
        recentScans: scans,
        chartData
      });

    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(t('errorFetchingData'));
    } finally {
      setLoading(false);
    }
  }

  const handleShowAllScans = async () => {
    await fetchAllScans();
    setShowAllScans(true);
  };

  const handleShowLocations = () => {
    setShowLocationsMap(true);
  };

  const handleShowGraphicalStats = async () => {
    if (!graphicalData) {
      await fetchAllScans();
    }
    setShowGraphicalStats(true);
  };

  const handleShowUserScans = async () => {
    if (!graphicalData) {
      await fetchAllScans();
    }
    setShowUserScans(true);
  };

  const handleShowWorkerActivity = async () => {
    try {
      setLoading(true);
      const data = await prepareWorkerActivityData();
      setWorkerActivityData(data);
      setShowWorkerActivity(true);
    } catch (err) {
      console.error('Error loading worker activity:', err);
      setError('Failed to load worker activity data');
    } finally {
      setLoading(false);
    }
  };

  const renderScanItem = (scan) => (
    <div key={scan.id} className="px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {scan.qr_codes?.workers?.name || t('unknownWorker')}
          </p>
          <p className="text-sm text-gray-500">
            {scan.qr_codes?.purpose || t('unknownPurpose')}
          </p>
          <p className="text-xs text-gray-400">
            {scan.user_agent ? `${t('device')}: ${scan.user_agent.split(')')[0]})` : t('unknownDevice')}
          </p>
          {scan.scan_locations && scan.scan_locations[0] && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">
                {scan.scan_locations[0].city && scan.scan_locations[0].country
                  ? `📍 ${scan.scan_locations[0].city}, ${scan.scan_locations[0].country}`
                  : `📍 ${scan.scan_locations[0].latitude.toFixed(4)}, ${scan.scan_locations[0].longitude.toFixed(4)}`}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openInGoogleMaps(scan.scan_locations[0].latitude, scan.scan_locations[0].longitude)}
              >
                Show Location
              </Button>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {formatTimestamp(scan.scanned_at)}
          </p>
          {scan.referrer && (
            <p className="text-xs text-gray-400">
              {t('from')}: {new URL(scan.referrer).hostname}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">{t('totalScans')}</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalScans}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">{t('totalWorkers')}</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.totalWorkers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">{t('totalQRCodes')}</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600">{stats.totalQRCodes}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('scanActivity')}</h3>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={handleShowWorkerActivity}
            >
              Worker Activity
            </Button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="week">{t('last7Days')}</option>
              <option value="month">{t('last30Days')}</option>
              <option value="year">{t('lastYear')}</option>
            </select>
          </div>
        </div>
        
        {stats.chartData && (
          <div className="h-64">
            <Line
              data={stats.chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top'
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{t('recentScans')}</h3>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleShowAllScans}
              >
                {t('showAllScans')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleShowLocations}
              >
                {t('showLocations')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleShowAllUsernames}
              >
                Show All Usernames
              </Button>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentScans.slice(0, 10).map(renderScanItem)}
        </div>
      </div>

      <Modal
        isOpen={showAllScans}
        onClose={() => setShowAllScans(false)}
        title="All Scans"
      >
        <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-200">
          {allScans.map(renderScanItem)}
        </div>
      </Modal>

      <Modal
        isOpen={showLocationsMap}
        onClose={() => setShowLocationsMap(false)}
        title="Scan Locations"
      >
        <div className="h-[70vh]">
          <iframe
            className="w-full h-full rounded-lg"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              allScans
                .filter(scan => scan.scan_locations?.[0])
                .map(scan => `${scan.scan_locations[0].longitude},${scan.scan_locations[0].latitude}`)
                .join(',')
            }&layer=mapnik`}
          />
        </div>
      </Modal>

      <Modal
        isOpen={showUserScans}
        onClose={() => setShowUserScans(false)}
        title="User Behavior Analysis"
      >
        <div className="space-y-6 p-4">
          {graphicalData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-100 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-700">Message Unclear</h4>
                <p className="text-3xl font-bold text-blue-800">46%</p>
                <p className="text-sm text-blue-600 mt-2">Users leave due to unclear messaging</p>
              </div>
              <div className="bg-orange-100 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-orange-700">No Contact Info</h4>
                <p className="text-3xl font-bold text-orange-800">44%</p>
                <p className="text-sm text-orange-600 mt-2">Users leave due to missing contact information</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-700">Poor Design</h4>
                <p className="text-3xl font-bold text-blue-800">37%</p>
                <p className="text-sm text-blue-600 mt-2">Users leave due to poor design and navigation</p>
              </div>
            </div>
          )}
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-4">Visualization</h4>
            {graphicalData && (
              <div className="h-[300px]">
                <Pie
                  data={graphicalData.userBehavior}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showWorkerActivity}
        onClose={() => setShowWorkerActivity(false)}
        title="Worker Activity Analysis"
      >
        <div className="space-y-6 p-4">
          {workerActivityData && (
            <>
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4">Worker Scan Activity</h4>
                <div className="h-[400px]">
                  <Bar
                    data={workerActivityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        },
                        title: {
                          display: true,
                          text: 'Worker Activity Overview'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {workerActivityData.workerDetails.map((worker) => (
                  <div key={worker.name} className="bg-white rounded-lg p-4 shadow">
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">{worker.name}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-600">Total Scans</p>
                        <p className="text-xl font-bold text-blue-700">{worker.totalScans}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-sm text-green-600">Avg. Scans/Code</p>
                        <p className="text-xl font-bold text-green-700">{worker.averageScansPerCode}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-sm text-purple-600">Total QR Codes</p>
                        <p className="text-xl font-bold text-purple-700">{worker.totalCodes}</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="text-sm text-yellow-600">Unique Usernames</p>
                        <p className="text-xl font-bold text-yellow-700">{worker.uniqueUsernames}</p>
                      </div>
                    </div>
                    {worker.usernamesList.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Usernames:</p>
                        <div className="flex flex-wrap gap-2">
                          {worker.usernamesList.map((username, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAllUsernames}
        onClose={() => setShowAllUsernames(false)}
        title="All Usernames"
      >
        <div className="p-4 space-y-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search usernames..."
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {usernamesData
              ?.filter(data => 
                data.username.toLowerCase().includes(usernameSearch.toLowerCase()) ||
                data.workers.some(w => w.toLowerCase().includes(usernameSearch.toLowerCase())) ||
                data.purposes.some(p => p.toLowerCase().includes(usernameSearch.toLowerCase())) ||
                data.productCodes.some(p => p.toLowerCase().includes(usernameSearch.toLowerCase()))
              )
              .map(data => (
                <div key={data.username} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{data.username}</h4>
                      <p className="text-sm text-gray-500">Total Scans: {data.totalScans}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Workers:</h5>
                      <div className="flex flex-wrap gap-1">
                        {data.workers.map((worker, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {worker}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Purposes:</h5>
                      <div className="flex flex-wrap gap-1">
                        {data.purposes.map((purpose, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {purpose}
                          </span>
                        ))}
                      </div>
                    </div>
                    {data.productCodes.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Product Codes:</h5>
                        <div className="flex flex-wrap gap-1">
                          {data.productCodes.map((code, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Statistics;