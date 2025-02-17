import { createContext, useContext } from 'react';

// Language configurations
const languages = {
  en: {
    name: 'English',
    code: 'en',
    flag: '🇬🇧'
  },
  ro: {
    name: 'Română',
    code: 'ro',
    flag: '🇷🇴'
  },
  ru: {
    name: 'Русский',
    code: 'ru',
    flag: '🇷🇺'
  }
};

// Translations
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    workers: 'Workers',
    qrGenerator: 'QR Generator',
    statistics: 'Statistics',
    
    // Dashboard
    totalWorkers: 'Total Workers',
    totalQRCodes: 'Total QR Codes',
    totalScans: 'Total Scans',
    quickActions: 'Quick Actions',
    addNewWorker: 'Add New Worker',
    generateQRCode: 'Generate QR Code',
    viewStatistics: 'View Statistics',
    
    // Workers
    workersList: 'Workers List',
    workerName: 'Worker Name',
    workerCode: 'Worker Code',
    viewQRCodes: 'View QR Codes',
    deleteWorker: 'Delete Worker',
    errorAddingWorker: 'Failed to add worker. Please try again.',
    errorFetchingData: 'Failed to fetch data',
    errorDeletingWorker: 'Failed to delete worker',
    errorDeletingQR: 'Failed to delete QR code',
    searchQRCodes: 'Search QR codes...',
    
    // QR Generator
    selectWorker: 'Select Worker',
    purpose: 'Purpose',
    productCode: 'Product Code',
    destinationURL: 'Destination URL',
    generate: 'Generate',
    download: 'Download QR Code',
    delete: 'Delete',
    viewQR: 'View QR',
    qrCode: 'QR Code',
    qrCodes: 'QR Codes',
    openQR: 'Open QR',
    
    // Statistics
    scanActivity: 'Scan Activity',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    lastYear: 'Last Year',
    scansPerDay: 'Scans per Day',
    recentScans: 'Recent Scans',
    unknownWorker: 'Unknown Worker',
    unknownPurpose: 'Unknown Purpose',
    unknownDevice: 'Unknown Device',
    device: 'Device',
    from: 'From',
    showAllScans: 'Show All Scans',
    showLocations: 'Show Locations',
    allScans: 'All Scans',
    scanLocations: 'Scan Locations',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    created: 'Created',
    scans: 'Scans',
    redirecting: 'Redirecting...',
    invalidQRCode: 'Invalid QR code',
    destination: 'Destination',
    automaticRedirect: 'You will be redirected automatically in a moment.',
    
    // New translations for worker management
    searchWorkers: 'Search workers...',
    sort: 'Sort A-Z',
    sortAsc: 'Sort A-Z',
    sortDesc: 'Sort Z-A',
    usernameLabel: 'Username Label',
    filterWorkers: 'Filter Workers',
  },
  
  ro: {
    // Navigation
    dashboard: 'Panou Principal',
    workers: 'Angajați',
    qrGenerator: 'Generator QR',
    statistics: 'Statistici',
    
    // Dashboard
    totalWorkers: 'Total Angajați',
    totalQRCodes: 'Total Coduri QR',
    totalScans: 'Total Scanări',
    quickActions: 'Acțiuni Rapide',
    addNewWorker: 'Adaugă Angajat',
    generateQRCode: 'Generează Cod QR',
    viewStatistics: 'Vezi Statistici',
    
    // Workers
    workersList: 'Lista Angajaților',
    workerName: 'Nume Angajat',
    workerCode: 'Cod Angajat',
    viewQRCodes: 'Vezi Coduri QR',
    deleteWorker: 'Șterge Angajat',
    errorAddingWorker: 'Eroare la adăugarea angajatului. Încercați din nou.',
    errorFetchingData: 'Eroare la încărcarea datelor',
    errorDeletingWorker: 'Eroare la ștergerea angajatului',
    errorDeletingQR: 'Eroare la ștergerea codului QR',
    searchQRCodes: 'Caută coduri QR...',
    
    // QR Generator
    selectWorker: 'Selectează Angajat',
    purpose: 'Scop',
    productCode: 'Cod Produs',
    destinationURL: 'URL Destinație',
    generate: 'Generează',
    download: 'Descarcă Cod QR',
    delete: 'Șterge',
    viewQR: 'Vezi QR',
    qrCode: 'Cod QR',
    qrCodes: 'Coduri QR',
    openQR: 'Deschide QR',
    
    // Statistics
    scanActivity: 'Activitate Scanări',
    last7Days: 'Ultimele 7 Zile',
    last30Days: 'Ultimele 30 Zile',
    lastYear: 'Ultimul An',
    scansPerDay: 'Scanări pe Zi',
    recentScans: 'Scanări Recente',
    unknownWorker: 'Angajat Necunoscut',
    unknownPurpose: 'Scop Necunoscut',
    unknownDevice: 'Dispozitiv Necunoscut',
    device: 'Dispozitiv',
    from: 'De la',
    showAllScans: 'Arată Toate Scanările',
    showLocations: 'Arată Locațiile',
    allScans: 'Toate Scanările',
    scanLocations: 'Locațiile Scanărilor',
    
    // Common
    loading: 'Se încarcă...',
    error: 'Eroare',
    success: 'Succes',
    cancel: 'Anulează',
    save: 'Salvează',
    edit: 'Editează',
    created: 'Creat',
    scans: 'Scanări',
    redirecting: 'Se redirecționează...',
    invalidQRCode: 'Cod QR invalid',
    destination: 'Destinație',
    automaticRedirect: 'Veți fi redirecționat automat în câteva momente.',
    
    // New translations for worker management
    searchWorkers: 'Caută angajați...',
    sort: 'Sortare A-Z',
    sortAsc: 'Sortare A-Z',
    sortDesc: 'Sortare Z-A',
    usernameLabel: 'Etichetă Utilizator',
    filterWorkers: 'Filtrare Angajați',
  },
  
  ru: {
    // Navigation
    dashboard: 'Панель управления',
    workers: 'Сотрудники',
    qrGenerator: 'Генератор QR',
    statistics: 'Статистика',
    
    // Dashboard
    totalWorkers: 'Всего сотрудников',
    totalQRCodes: 'Всего QR кодов',
    totalScans: 'Всего сканирований',
    quickActions: 'Быстрые действия',
    addNewWorker: 'Добавить сотрудника',
    generateQRCode: 'Создать QR код',
    viewStatistics: 'Просмотр статистики',
    
    // Workers
    workersList: 'Список сотрудников',
    workerName: 'Имя сотрудника',
    workerCode: 'Код сотрудника',
    viewQRCodes: 'Просмотр QR кодов',
    deleteWorker: 'Удалить сотрудника',
    errorAddingWorker: 'Ошибка при добавлении сотрудника. Попробуйте снова.',
    errorFetchingData: 'Ошибка при загрузке данных',
    errorDeletingWorker: 'Ошибка при удалении сотрудника',
    errorDeletingQR: 'Ошибка при удалении QR кода',
    searchQRCodes: 'Поиск QR кодов...',
    
    // QR Generator
    selectWorker: 'Выберите сотрудника',
    purpose: 'Назначение',
    productCode: 'Код продукта',
    destinationURL: 'URL назначения',
    generate: 'Создать',
    download: 'Скачать QR код',
    delete: 'Удалить',
    viewQR: 'Просмотр QR',
    qrCode: 'QR код',
    qrCodes: 'QR коды',
    openQR: 'Открыть QR',
    
    // Statistics
    scanActivity: 'Активность сканирований',
    last7Days: 'Последние 7 дней',
    last30Days: 'Последние 30 дней',
    lastYear: 'Последний год',
    scansPerDay: 'Сканирований в день',
    recentScans: 'Последние сканирования',
    unknownWorker: 'Неизвестный сотрудник',
    unknownPurpose: 'Неизвестное назначение',
    unknownDevice: 'Неизвестное устройство',
    device: 'Устройство',
    from: 'От',
    showAllScans: 'Показать все сканирования',
    showLocations: 'Показать локации',
    allScans: 'Все сканирования',
    scanLocations: 'Локации сканирований',
    
    // Common
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    cancel: 'Отмена',
    save: 'Сохранить',
    edit: 'Редактировать',
    created: 'Создано',
    scans: 'Сканирований',
    redirecting: 'Перенаправление...',
    invalidQRCode: 'Недействительный QR код',
    destination: 'Назначение',
    automaticRedirect: 'Вы будете автоматически перенаправлены через несколько секунд.',
    
    // New translations for worker management
    searchWorkers: 'Поиск сотрудников...',
    sort: 'Сортировка А-Я',
    sortAsc: 'Сортировка А-Я',
    sortDesc: 'Сортировка Я-А',
    usernameLabel: 'Метка пользователя',
    filterWorkers: 'Фильтр сотрудников',
  }
};

// Create a context for language management
const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

const useLanguage = () => useContext(LanguageContext);

const t = (key, language) => {
  return translations[language]?.[key] || translations.en[key] || key;
};

export {
  languages,
  LanguageContext,
  useLanguage,
  t
};