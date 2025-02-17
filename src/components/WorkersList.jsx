import React, { useEffect, useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabaseClient';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useLanguage } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';

function WorkersList() {
  const [workers, setWorkers] = useState([]);
  const [qrCodes, setQRCodes] = useState({});
  const [scanCounts, setScanCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRListModal, setShowQRListModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrSearchQuery, setQRSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [qrSortDirection, setQRSortDirection] = useState('asc');
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const filteredWorkers = useMemo(() => {
    let filtered = [...workers];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(worker => 
        worker.name.toLowerCase().includes(query) ||
        worker.code.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortDirection === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    return filtered;
  }, [workers, searchQuery, sortDirection]);

  const filteredQRCodes = useMemo(() => {
    if (!selectedWorker || !qrCodes[selectedWorker.id]) return [];

    let filtered = [...qrCodes[selectedWorker.id]];

    if (qrSearchQuery) {
      const query = qrSearchQuery.toLowerCase();
      filtered = filtered.filter(qr => 
        qr.purpose.toLowerCase().includes(query) ||
        (qr.username && qr.username.toLowerCase().includes(query)) ||
        (qr.product_code && qr.product_code.toLowerCase().includes(query))
      );
    }

    filtered.sort((a, b) => {
      const purposeA = a.purpose.toLowerCase();
      const purposeB = b.purpose.toLowerCase();
      return qrSortDirection === 'asc'
        ? purposeA.localeCompare(purposeB)
        : purposeB.localeCompare(purposeA);
    });

    return filtered;
  }, [selectedWorker, qrCodes, qrSearchQuery, qrSortDirection]);

  async function fetchWorkers() {
    try {
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*');
      
      if (workersError) throw workersError;

      const { data: qrCodesData, error: qrError } = await supabase
        .from('qr_codes')
        .select('*');

      if (qrError) throw qrError;

      const { data: scanData, error: scanError } = await supabase
        .from('qr_scans')
        .select(`
          id,
          qr_codes (
            worker_id
          )
        `);

      if (scanError) throw scanError;

      const workerScanCounts = scanData.reduce((acc, scan) => {
        const workerId = scan.qr_codes?.worker_id;
        if (workerId) {
          acc[workerId] = (acc[workerId] || 0) + 1;
        }
        return acc;
      }, {});

      const qrCodesByWorker = qrCodesData.reduce((acc, qr) => {
        if (!acc[qr.worker_id]) {
          acc[qr.worker_id] = [];
        }
        acc[qr.worker_id].push(qr);
        return acc;
      }, {});

      setWorkers(workersData || []);
      setQRCodes(qrCodesByWorker);
      setScanCounts(workerScanCounts);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('errorFetchingData'));
    }
  }

  async function handleDeleteWorker(workerId) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', workerId);

      if (error) throw error;

      await fetchWorkers();
    } catch (err) {
      setError(t('errorDeletingWorker'));
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteQR(qrId) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrId);

      if (error) throw error;

      await fetchWorkers();
      setShowQRModal(false);
      setSelectedQR(null);
    } catch (err) {
      console.error('Error deleting QR code:', err);
      setError(t('errorDeletingQR'));
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadQR = (qr) => {
    const canvas = document.createElement('canvas');
    const svg = document.querySelector('.qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 256, 256);

      const link = document.createElement('a');
      link.download = `qr-code-${qr.tracking_url}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleShowQRList = (worker) => {
    setSelectedWorker(worker);
    setQRSearchQuery('');
    setQRSortDirection('asc');
    setShowQRListModal(true);
  };

  const handleShowQR = (qr) => {
    setSelectedQR(qr);
    setShowQRModal(true);
  };

  const handleOpenQR = (qr) => {
    const redirectUrl = `${window.location.origin}/r/${qr.tracking_url}`;
    window.open(redirectUrl, '_blank');
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const toggleQRSortDirection = () => {
    setQRSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('workersList')}</h2>
        <Button
          onClick={() => navigate('/redoman/add-worker')}
        >
          {t('addNewWorker')}
        </Button>
      </div>

      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('searchWorkers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="secondary"
            onClick={toggleSortDirection}
            className="flex items-center space-x-2"
          >
            <span>{t('sort')}</span>
            <span className="text-lg">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.map((worker) => (
          <div key={worker.id} className="border rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{worker.name}</h3>
              <p className="text-gray-600">{t('workerCode')}: {worker.code}</p>
              <p className="text-gray-600">{t('totalScans')}: {scanCounts[worker.id] || 0}</p>
              <p className="text-gray-600">
                {t('qrCodes')}: {qrCodes[worker.id]?.length || 0}
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => handleShowQRList(worker)}
                variant="secondary"
                disabled={!qrCodes[worker.id]?.length}
              >
                {t('viewQRCodes')}
              </Button>
              
              <Button
                onClick={() => handleDeleteWorker(worker.id)}
                variant="danger"
                isLoading={loading}
              >
                {t('deleteWorker')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showQRListModal}
        onClose={() => {
          setShowQRListModal(false);
          setSelectedWorker(null);
          setQRSearchQuery('');
        }}
        title={selectedWorker ? `${t('qrCodes')} - ${selectedWorker.name}` : t('qrCodes')}
      >
        {selectedWorker && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('searchQRCodes')}
                  value={qrSearchQuery}
                  onChange={(e) => setQRSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button
                variant="secondary"
                onClick={toggleQRSortDirection}
                className="flex items-center space-x-2"
              >
                <span>{t('sort')}</span>
                <span className="text-lg">
                  {qrSortDirection === 'asc' ? '↑' : '↓'}
                </span>
              </Button>
            </div>
            <div className="grid gap-4">
              {filteredQRCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold">
                      {qr.username && `(${qr.username}) `}{qr.purpose}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {t('created')}: {new Date(qr.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('scans')}: {qr.scan_count || 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleShowQR(qr)}
                    >
                      {t('viewQR')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteQR(qr.id)}
                      isLoading={loading}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setSelectedQR(null);
        }}
        title={selectedQR ? `${t('qrCode')} - ${selectedQR.username ? `(${selectedQR.username}) ` : ''}${selectedQR.purpose} ${selectedQR.product_code}` : t('qrCode')}
      >
        {selectedQR && (
          <div className="flex flex-col items-center">
            <TransformWrapper>
              <TransformComponent>
                <QRCodeSVG
                  value={`${window.location.origin}/r/${selectedQR.tracking_url}`}
                  size={256}
                  level="H"
                  includeMargin
                  className="qr-code-svg"
                  {...(selectedQR.customization || {})}
                />
              </TransformComponent>
            </TransformWrapper>
            <div className="mt-4 space-y-2 text-center">
              <p className="text-sm text-gray-500">
                {t('purpose')}: {selectedQR.username ? `(${selectedQR.username}) ` : ''}{selectedQR.purpose}{selectedQR.product_code}
              </p>
              <p className="text-sm text-gray-500">
                {t('scans')}: {selectedQR.scan_count || 0}
              </p>
              <p className="text-xs text-gray-400">
                {t('created')}: {new Date(selectedQR.created_at).toLocaleDateString()}
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadQR(selectedQR)}
                >
                  {t('download')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenQR(selectedQR)}
                >
                  {t('openQR')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteQR(selectedQR.id)}
                  isLoading={loading}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default WorkersList;