import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabaseClient';
import { createAuditLog } from '../lib/utils';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Button from './ui/Button';
import Modal from './ui/Modal';

function QRCodeGenerator() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [purpose, setPurpose] = useState('');
  const [username, setUsername] = useState('');
  const [productCode, setProductCode] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [qrSize, setQrSize] = useState(256);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedQrCode, setGeneratedQrCode] = useState(null);
  const [qrOptions, setQrOptions] = useState({
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    level: 'H',
    includeMargin: true,
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, code');
    
    if (error) {
      console.error('Error fetching workers:', error);
      return;
    }
    
    setWorkers(data || []);
  }

  async function handleDeleteQR(qrId) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrId);

      if (error) throw error;

      setGeneratedQrCode(null);
      setSuccess(false);
      setError('');
    } catch (err) {
      console.error('Error deleting QR code:', err);
      setError('Failed to delete QR code');
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadQR = () => {
    if (!generatedQrCode) return;

    const canvas = document.createElement('canvas');
    const svg = document.querySelector('.qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = qrOptions.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, qrSize, qrSize);

      const link = document.createElement('a');
      link.download = `qr-code-${generatedQrCode.tracking_url}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const trackingCode = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);

      const { data, error: qrError } = await supabase
        .from('qr_codes')
        .insert([
          {
            worker_id: selectedWorker,
            purpose: purpose,
            username: username,
            target_url: targetUrl,
            tracking_url: trackingCode,
            customization: { 
              size: qrSize,
              fgColor: qrOptions.fgColor,
              bgColor: qrOptions.bgColor,
              level: qrOptions.level
            },
            scan_count: 0,
            product_code: productCode
          }
        ])
        .select()
        .single();

      if (qrError) throw qrError;

      await createAuditLog(supabase, {
        userId: selectedWorker,
        action: 'create',
        resourceType: 'qr_code',
        resourceId: data.id,
        details: { purpose: purpose, target_url: targetUrl, product_code: productCode }
      });

      setGeneratedQrCode({
        ...data,
        redirectUrl: `${window.location.origin}/r/${trackingCode}`
      });
      
      setSuccess(true);
      setPurpose('');
      setUsername('');
      setProductCode('');
      setTargetUrl('');
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">QR Code Generator</h2>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {success && generatedQrCode && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <h3 className="text-green-700 font-semibold mb-2">QR Code Generated Successfully!</h3>
          <p className="text-green-600 text-sm mb-4">
            Your QR code has been created and is ready to use. When scanned, it will automatically redirect to your specified URL.
          </p>
          <div className="flex justify-center bg-white p-4 rounded-lg shadow-sm">
            <QRCodeSVG
              value={generatedQrCode.redirectUrl}
              size={200}
              level={qrOptions.level}
              includeMargin={qrOptions.includeMargin}
              fgColor={qrOptions.fgColor}
              bgColor={qrOptions.bgColor}
              className="qr-code-svg"
            />
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Redirect URL: {generatedQrCode.redirectUrl}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadQR}
              >
                Download QR Code
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteQR(generatedQrCode.id)}
                isLoading={loading}
              >
                Delete QR Code
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Worker
          </label>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="w-full border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a worker...</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name} ({worker.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Username Label
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., John123"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Purpose
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Company Website, Product Page"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Cod Produse
          </label>
          <input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            className="w-full border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., PRD001"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Destination URL
          </label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            Enter the website URL where users should be redirected when they scan the QR code
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            className="flex-1"
          >
            Generate QR Code
          </Button>
        </div>
      </form>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="QR Code Preview"
      >
        <div className="flex flex-col items-center">
          <TransformWrapper>
            <TransformComponent>
              {generatedQrCode && (
                <QRCodeSVG
                  value={generatedQrCode.redirectUrl}
                  size={256}
                  level={qrOptions.level}
                  includeMargin={qrOptions.includeMargin}
                  fgColor={qrOptions.fgColor}
                  bgColor={qrOptions.bgColor}
                  className="qr-code-svg"
                />
              )}
            </TransformComponent>
          </TransformWrapper>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Scan with a QR code reader to test
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default QRCodeGenerator;