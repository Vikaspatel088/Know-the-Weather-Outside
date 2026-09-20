import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { CurrentWeatherHero } from './components/weather/CurrentWeatherHero';
import { WeatherIntelligencePanel } from './components/intelligence/WeatherIntelligencePanel';
import { HourlyForecast } from './components/weather/HourlyForecast';
import { PrecipitationTimeline } from './components/weather/PrecipitationTimeline';
import { DailyForecast } from './components/weather/DailyForecast';
import { WeatherMetricsGrid } from './components/metrics/WeatherMetricsGrid';
import { WeatherRadar } from './components/radar/WeatherRadar';
import { ActivityRecommendations } from './components/intelligence/ActivityRecommendations';
import { WeatherAlertBanner } from './components/alerts/WeatherAlertBanner';
import { LocationSearchModal } from './components/search/LocationSearchModal';
import { WeatherSkeleton } from './components/common/WeatherSkeleton';
import { ErrorState } from './components/common/ErrorState';
import { WeatherBackground } from './components/weather/WeatherBackground';
import { WeatherService } from './services/weatherService';
import { getWeatherVisualState } from './services/weatherVisuals';
import { WeatherDataBundle, UnitType } from './types/weather';
import './App.css';

type NavTab = 'today' | 'forecast' | 'radar' | 'alerts';

export function App() {
  const [currentLocationId, setCurrentLocationId] = useState('26.91240,75.78730');
  const [weatherData, setWeatherData] = useState<WeatherDataBundle | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<UnitType>('celsius');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [savedLocationIds, setSavedLocationIds] = useState<string[]>(() => { try { const stored = window.localStorage.getItem('atmos:saved-locations'); return stored ? JSON.parse(stored) : ['26.91240,75.78730']; } catch { return ['26.91240,75.78730']; } });
  const [isLocating, setIsLocating] = useState(false);
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(0);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { if (weatherData) { document.documentElement.setAttribute('data-weather-condition', weatherData.current.condition); document.documentElement.setAttribute('data-weather-visual', getWeatherVisualState(weatherData.current.condition, weatherData.location.localTime).stateKey); } }, [weatherData]);
  useEffect(() => { window.localStorage.setItem('atmos:saved-locations', JSON.stringify(savedLocationIds)); }, [savedLocationIds]);
  const loadWeather = useCallback(async (locationId: string) => { setIsLoading(true); setError(null); try { const data = await WeatherService.getWeatherData(locationId); setWeatherData(data); setCurrentLocationId(locationId); } catch (err) { console.error('Failed to fetch weather data:', err); setError('Weather data is temporarily unavailable. Please try again.'); } finally { setIsLoading(false); } }, []);
  useEffect(() => { loadWeather(currentLocationId); }, [currentLocationId, loadWeather]);
  const handleDetectLocation = () => { if (!navigator.geolocation) { alert('Geolocation is not supported by your current browser.'); return; } setIsLocating(true); navigator.geolocation.getCurrentPosition((pos) => { WeatherService.reverseLocation(pos.coords.latitude, pos.coords.longitude).then((location) => loadWeather(location.id)).catch(() => setError('Unable to resolve your current location.')).finally(() => setIsLocating(false)); }, () => { setError('Location permission was not available. Search for a location instead.'); setIsLocating(false); }, { timeout: 7000, maximumAge: 300000 }); };
  const handleToggleSaveLocation = (id: string) => setSavedLocationIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  const handleIntelligenceAction = (actionType: 'precip' | 'radar' | 'hourly' | 'aqi' | 'lifestyle') => { if (actionType === 'radar') setActiveTab('radar'); else if (actionType === 'hourly') setActiveTab('forecast'); else if (actionType === 'precip') { setActiveTab('today'); document.getElementById('precipitation-section')?.scrollIntoView({ behavior: 'smooth' }); } else if (actionType === 'lifestyle') { setActiveTab('today'); document.getElementById('activities-section')?.scrollIntoView({ behavior: 'smooth' }); } };
  const hasAlerts = Boolean(weatherData?.alerts?.length);
  return <div className="atmos-root">
    <WeatherBackground condition={weatherData?.current.condition || 'partly-cloudy-day'} localTime={weatherData?.location.localTime} theme={theme} />
    {weatherData && <Navbar currentLocation={weatherData.location} activeTab={activeTab} onSelectTab={setActiveTab} onOpenSearch={() => setIsSearchOpen(true)} onOpenSaved={() => setIsSearchOpen(true)} onDetectLocation={handleDetectLocation} isLocating={isLocating} unit={unit} onToggleUnit={() => setUnit((prev) => prev === 'celsius' ? 'fahrenheit' : 'celsius')} theme={theme} onToggleTheme={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')} hasActiveAlerts={hasAlerts} />}
    <main className="container atmos-main-content">
      {isLoading && <WeatherSkeleton />}
      {error && !isLoading && <ErrorState message={error} onRetry={() => loadWeather(currentLocationId)} onChangeLocation={() => setIsSearchOpen(true)} />}
      {!isLoading && !error && weatherData && <>
        {hasAlerts && <WeatherAlertBanner alerts={weatherData.alerts} />}
        {activeTab === 'today' && <div className="tab-view-today"><div className="today-upper-grid"><div className="upper-grid-left"><CurrentWeatherHero location={weatherData.location} weather={weatherData.current} unit={unit} onOpenRadar={() => setActiveTab('radar')} /><div id="precipitation-section"><PrecipitationTimeline timeline={weatherData.precipitationTimeline} /></div><HourlyForecast hourly={weatherData.hourly} unit={unit} selectedHour={selectedHourIndex} onSelectHour={setSelectedHourIndex} /></div><div className="upper-grid-right"><WeatherIntelligencePanel insights={weatherData.intelligence} onActionClick={handleIntelligenceAction} /><div id="activities-section"><ActivityRecommendations activities={weatherData.activities} /></div></div></div><div className="today-lower-grid"><div className="lower-grid-left"><DailyForecast daily={weatherData.daily} unit={unit} /></div><div className="lower-grid-right"><WeatherMetricsGrid current={weatherData.current} sunMoon={weatherData.sunMoon} airQuality={weatherData.airQuality} unit={unit} onOpenAirQuality={() => setActiveTab('today')} /></div></div></div>}
        {activeTab === 'forecast' && <div className="tab-view-forecast"><div className="view-intro-header"><h2 className="view-headline">Forecast Analysis</h2><p className="view-subheadline">Hourly and 7-day provider forecast for {weatherData.location.name}.</p></div><HourlyForecast hourly={weatherData.hourly} unit={unit} selectedHour={selectedHourIndex} onSelectHour={setSelectedHourIndex} /><div className="forecast-split-grid"><DailyForecast daily={weatherData.daily} unit={unit} /><PrecipitationTimeline timeline={weatherData.precipitationTimeline} /></div></div>}
        {activeTab === 'radar' && <div className="tab-view-radar"><WeatherRadar location={weatherData.location} radarTimestamp={weatherData.radarTimestamp} /></div>}
        {activeTab === 'alerts' && <div className="tab-view-alerts"><div className="view-intro-header"><h2 className="view-headline">Weather Advisories</h2><p className="view-subheadline">Generated weather signals for {weatherData.location.name}. Official alerts are unavailable through the current provider.</p></div>{hasAlerts ? <WeatherAlertBanner alerts={weatherData.alerts} /> : <div className="no-alerts-card weather-card"><p>No generated weather advisories for this location.</p><small>Official alert data is unavailable.</small></div>}</div>}
      </>}
    </main>
    <footer className="atmos-footer"><div className="container atmos-footer-inner"><div><span className="footer-brand">ATMOS Intelligence</span><span className="footer-dot">·</span><span>Coordinate-based forecast service</span></div><div><span>{weatherData?.metadata?.provider || 'Weather provider'}</span><span className="footer-dot">·</span><span>Data synced at {weatherData?.current.lastUpdated || 'Just now'}</span></div></div></footer>
    <LocationSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectLocation={(locId) => loadWeather(locId)} savedLocationIds={savedLocationIds} onToggleSaveLocation={handleToggleSaveLocation} unit={unit} />
    <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} hasActiveAlerts={hasAlerts} />
  </div>;
}
export default App;
