import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { setCookie, getCookie } from '../utils/cookies';
import { formatDuration } from '../utils/api';
import './HomePage.css';

const HomePage = ({ user }) => {
  const { t, i18n } = useTranslation();
  
  const [timeRange, setTimeRange] = useState(getCookie('bm_timeRange') || '30m');
  const [continent, setContinent] = useState(getCookie('bm_continent') || 'All');
  const [country, setCountry] = useState(getCookie('bm_country') || '');
  const [maxEntries, setMaxEntries] = useState(getCookie('bm_maxEntries') || '25');
  const [continents, setContinents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load continents on mount
  useEffect(() => {
    const fetchContinents = async () => {
      try {
        const response = await fetch('/public/continents');
        const continentsData = await response.json();
        setContinents(['All', ...continentsData]);
      } catch (error) {
        console.error('Error loading continents:', error);
      }
    };
    fetchContinents();
  }, []);

  // Load countries when continent changes
  useEffect(() => {
    const fetchCountries = async () => {
      if (continent === 'All' || continent === 'Global') {
        setCountries([]);
        setCountry('');
        return;
      }

      try {
        const response = await fetch(`/public/countries?continent=${encodeURIComponent(continent)}`);
        const countriesData = await response.json();
        setCountries(countriesData);
      } catch (error) {
        console.error('Error loading countries:', error);
        setCountries([]);
      }
    };
    fetchCountries();
  }, [continent]);

  // Load grouped data
  const loadGroupedData = useCallback(async () => {
    try {
      let url = `/public/lastheard/grouped?timeRange=${timeRange}&limit=${maxEntries}`;
      if (continent && continent !== 'All') {
        url += `&continent=${encodeURIComponent(continent)}`;
      }
      if (country) {
        url += `&country=${encodeURIComponent(country)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const groupedData = await response.json();
      setData(groupedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading grouped data:', error);
      setData([]);
      setLoading(false);
    }
  }, [timeRange, continent, country, maxEntries]);

  // Load data when filters change
  useEffect(() => {
    loadGroupedData();
  }, [loadGroupedData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadGroupedData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadGroupedData]);

  // Save preferences when changed
  const handleTimeRangeChange = (e) => {
    const value = e.target.value;
    setTimeRange(value);
    setCookie('bm_timeRange', value, 15);
  };

  const handleContinentChange = (e) => {
    const value = e.target.value;
    setContinent(value);
    setCookie('bm_continent', value, 15);
  };

  const handleCountryChange = (e) => {
    const value = e.target.value;
    setCountry(value);
    setCookie('bm_country', value, 15);
  };

  const handleMaxEntriesChange = (e) => {
    const value = e.target.value;
    setMaxEntries(value);
    setCookie('bm_maxEntries', value, 15);
  };

  const handleLanguageChange = (e) => {
    const value = e.target.value;
    setCookie('bm_lang', value, 15);
    i18n.changeLanguage(value);
  };

  // Calculate chart data
  const qsoChartData = data.map(item => ({
    label: `${item.destinationName || 'N/A'} (${item.destinationId || 'N/A'})`,
    value: item.count || 0,
  }));

  const durationChartData = [...data]
    .sort((a, b) => (b.totalDuration || 0) - (a.totalDuration || 0))
    .map(item => ({
      label: `${item.destinationName || 'N/A'} (${item.destinationId || 'N/A'})`,
      value: item.totalDuration || 0,
    }));

  return (
    <div className="container">
      <Header 
        title={t('home.title')} 
        subtitle={t('home.subtitle')} 
        user={user} 
      />

      <div className="controls">
        <div className="control-group">
          <label htmlFor="timeRange">{t('home.timeRange')}</label>
          <select id="timeRange" value={timeRange} onChange={handleTimeRangeChange}>
            <option value="5m">{t('home.last5min')}</option>
            <option value="15m">{t('home.last15min')}</option>
            <option value="30m">{t('home.last30min')}</option>
            <option value="1h">{t('home.lastHour')}</option>
            <option value="2h">{t('home.last2hours')}</option>
            <option value="6h">{t('home.last6hours')}</option>
            <option value="12h">{t('home.last12hours')}</option>
            <option value="24h">{t('home.last24hours')}</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="continent">{t('home.continent')}</label>
          <select id="continent" value={continent} onChange={handleContinentChange}>
            {continents.map(cont => (
              <option key={cont} value={cont}>
                {cont === 'All' ? t('home.all') : cont === 'Global' ? t('home.global') : cont}
              </option>
            ))}
          </select>
        </div>

        {countries.length > 0 && (
          <div className="control-group">
            <label htmlFor="country">{t('home.country')}</label>
            <select id="country" value={country} onChange={handleCountryChange}>
              <option value="">{t('home.all')}</option>
              {countries.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="control-group">
          <label htmlFor="maxEntries">{t('home.maxEntries')}</label>
          <select id="maxEntries" value={maxEntries} onChange={handleMaxEntriesChange}>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="25">25</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="language">{t('home.language')}</label>
          <select id="language" value={i18n.language} onChange={handleLanguageChange}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>

      <BarChart 
        title={t('home.talkgroupQsoStats')} 
        data={qsoChartData} 
        loading={loading}
      />

      <BarChart 
        title={t('home.talkgroupDurationStats')} 
        data={durationChartData}
        loading={loading}
        isDuration={true}
      />

      <DataTable data={data} loading={loading} />

      <Footer />
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ title, data, loading, isDuration = false }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-title">{title}</div>
        <div className="bar-chart">
          <div className="loading">{t('home.loadingChart')}</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">{title}</div>
        <div className="bar-chart">
          <div className="no-data">{t('home.noDataDisplay')}</div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="chart-container">
      <div className="chart-title">{title}</div>
      <div className="bar-chart">
        {data.map((item, index) => {
          const widthPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const displayValue = isDuration ? formatDuration(item.value) : item.value;
          
          return (
            <div key={index} className="bar-item">
              <div className="bar-label" title={item.label}>{item.label}</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: `${widthPercentage}%` }}></div>
              </div>
              <div className="bar-value">{displayValue}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Data Table Component
const DataTable = ({ data, loading }) => {
  const { t } = useTranslation();

  return (
    <div className="table-container">
      <h2 className="chart-title">{t('home.talkgroupActivity')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('home.destinationName')}</th>
            <th>{t('home.destinationId')}</th>
            <th>{t('home.count')}</th>
            <th>{t('home.totalDuration')}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" className="loading">{t('home.loadingData')}</td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan="4" className="no-data">{t('home.noData')}</td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index}>
                <td className="talkgroup-name">{item.destinationName || 'N/A'}</td>
                <td className="talkgroup-id">{item.destinationId || 'N/A'}</td>
                <td className="count">{item.count || 0}</td>
                <td className="duration">{item.totalDuration ? formatDuration(item.totalDuration) : '0 sec'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HomePage;
