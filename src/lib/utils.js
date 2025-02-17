export const generateWorkerCode = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WRK-${year}-${randomNum}`;
};

export const createAuditLog = async (supabase, { userId, action, resourceType, resourceId, details }) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details
        }
      ]);
    
    if (error) throw error;
  } catch (err) {
    console.error('Error creating audit log:', err);
  }
};

export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateQRMetrics = (qrCodes) => {
  if (!qrCodes || qrCodes.length === 0) {
    return {
      totalGenerated: 0,
      successRate: 0,
      averageGenerationTime: 0,
      errorRate: 0
    };
  }

  return {
    totalGenerated: qrCodes.length,
    successRate: (qrCodes.filter(qr => !qr.error).length / qrCodes.length) * 100,
    averageGenerationTime: qrCodes.reduce((acc, qr) => acc + (qr.generationTime || 0), 0) / qrCodes.length,
    errorRate: (qrCodes.filter(qr => qr.error).length / qrCodes.length) * 100
  };
};