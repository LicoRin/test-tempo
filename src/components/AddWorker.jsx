import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';

function AddWorker() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error: supabaseError } = await supabase
        .from('workers')
        .insert([
          { name, code, visits_count: 0 }
        ]);

      if (supabaseError) {
        throw supabaseError;
      }

      navigate('/redoman/workers');
    } catch (err) {
      console.error('Error adding worker:', err);
      setError(t('errorAddingWorker'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('addNewWorker')}</h2>
        <Button
          variant="secondary"
          onClick={() => navigate('/redoman/workers')}
        >
          {t('cancel')}
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            {t('workerName')}
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          isLoading={loading}
          className="w-full"
        >
          {loading ? t('loading') : t('addNewWorker')}
        </Button>
      </form>
    </div>
  );
}

export default AddWorker