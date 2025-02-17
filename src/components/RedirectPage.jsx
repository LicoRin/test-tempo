import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../lib/i18n';

function RedirectPage() {
  const [error, setError] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const { code } = useParams();
  const { t } = useLanguage();

  const getLocationFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city,
        country: data.country_name,
        accuracy: null
      };
    } catch (err) {
      console.error('Error getting location from IP:', err);
      return null;
    }
  };

  useEffect(() => {
    async function handleRedirect() {
      try {
        if (!code) {
          setError(t('invalidQRCode'));
          return;
        }

        // Fetch QR code data
        const { data: qrCode, error: qrError } = await supabase
          .from('qr_codes')
          .select('id, target_url')
          .eq('tracking_url', code)
          .single();

        if (qrError || !qrCode) {
          console.error('Error fetching QR code:', qrError);
          setError(t('invalidQRCode'));
          return;
        }

        // Log initial scan
        const { data: scanData, error: scanError } = await supabase
          .from('qr_scans')
          .insert([
            {
              qr_code_id: qrCode.id,
              user_agent: navigator.userAgent,
              referrer: document.referrer,
              ip_address: 'anonymous', // For privacy
              utm_source: new URLSearchParams(window.location.search).get('utm_source'),
              utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
              utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
            }
          ])
          .select()
          .single();

        if (scanError) {
          console.error('Error logging scan:', scanError);
        }

        // Get user's location
        let locationData = null;

        try {
          // First try to get precise location from browser
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          // Try to get city and country using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const geoData = await response.json();
            
            if (geoData.address) {
              locationData.city = geoData.address.city || geoData.address.town || geoData.address.village;
              locationData.country = geoData.address.country;
            }
          } catch (geoError) {
            console.error('Error getting location details:', geoError);
          }
        } catch (locError) {
          console.error('Error getting precise location:', locError);
          // Fallback to IP-based location
          locationData = await getLocationFromIP();
        }

        // Save location data if available
        if (locationData && scanData) {
          const { error: locationError } = await supabase
            .from('scan_locations')
            .insert([{
              scan_id: scanData.id,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              accuracy: locationData.accuracy,
              city: locationData.city,
              country: locationData.country
            }]);

          if (locationError) {
            console.error('Error saving location:', locationError);
          }
        }

        // Handle special redirects based on domain and path
        const url = new URL(qrCode.target_url);
        let finalRedirectUrl = qrCode.target_url;

        if (url.hostname === 'mobila-buna-redirect.netlify.app') {
          if (url.pathname === '/' || url.pathname === '/index.html') {
            finalRedirectUrl = 'https://youtube.com';
          }
        } else if (url.hostname === 'mobila-buna-redirect.com') {
          if (url.pathname === '/' || url.pathname === '/index.html') {
            finalRedirectUrl = 'https://mobila-buna.md';
          }
        }

        setRedirectUrl(finalRedirectUrl);

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = finalRedirectUrl;
        }, 1500);

      } catch (err) {
        console.error('Error processing redirect:', err);
        setError(t('invalidQRCode'));
      }
    }

    handleRedirect();
  }, [code, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-sm w-full mx-4">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('error')}</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-sm w-full mx-4">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('redirecting')}</h1>
        <p className="text-gray-600 text-sm">{t('automaticRedirect')}</p>
        {redirectUrl && (
          <p className="text-gray-400 text-xs mt-4 truncate">
            {t('destination')}: {redirectUrl}
          </p>
        )}
      </div>
    </div>
  );
}

export default RedirectPage;