// MapOne.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  LayersControl,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapOne.css"; // Pastikan file CSS sudah dibuat sesuai
import {
  FaCloud,
  FaTint,
  FaTemperatureHigh,
  FaWind,
  FaCompressArrowsAlt,
} from "react-icons/fa";
import HomeButton from "./HomeButton"; // Pastikan path sesuai

const { BaseLayer, Overlay } = LayersControl;

const OPENWEATHERMAP_API_KEY = "98af2b03c911c7088a289f2a9b30770d"; // Ganti dengan API Key Anda

interface WeatherData {
  name: string;
  weather: { description: string; icon: string }[];
  main: {
    temp: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  wind: { speed: number; deg: number };
  visibility: number;
  coord: { lat: number; lon: number };
}

interface TempMarker {
  id: number;
  position: [number, number];
  weather: WeatherData | null;
}

const MapOne: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [showWeatherControls, setShowWeatherControls] = useState<boolean>(true); // State untuk toggle kontrol cuaca

  // State untuk opacity masing-masing layer cuaca
  const [cloudsOpacity, setCloudsOpacity] = useState<number>(0.5);
  const [precipitationOpacity, setPrecipitationOpacity] = useState<number>(0.5);
  const [temperatureOpacity, setTemperatureOpacity] = useState<number>(0.5);
  const [windOpacity, setWindOpacity] = useState<number>(0.5);
  const [pressureOpacity, setPressureOpacity] = useState<number>(0.5);

  // State untuk marker cuaca sementara
  const [tempMarkers, setTempMarkers] = useState<TempMarker[]>([]);
  const tempMarkerIdRef = useRef<number>(0);

  useEffect(() => {
    // Fungsi untuk mendapatkan lokasi pengguna
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setPosition([latitude, longitude]);
            fetchWeather(latitude, longitude);
          },
          (err) => {
            console.error("Error getting location:", err);
            setError("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
          }
        );
      } else {
        setError("Geolocation tidak didukung oleh browser Anda.");
      }
    };

    // Fungsi untuk mengambil data cuaca
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await axios.get<WeatherData>(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
        );
        setWeather(response.data);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError("Gagal mengambil data cuaca.");
      }
    };

    getLocation();
  }, []);

  // Handler untuk klik pada peta
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    const newId = tempMarkerIdRef.current++;

    // Tambahkan marker baru
    setTempMarkers((prev) => [
      ...prev,
      { id: newId, position: [lat, lng], weather: null },
    ]);

    // Ambil data cuaca untuk titik yang diklik
    axios
      .get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      )
      .then((response) => {
        setTempMarkers((prev) =>
          prev.map((marker) =>
            marker.id === newId ? { ...marker, weather: response.data } : marker
          )
        );
      })
      .catch((error) => {
        console.error("Error fetching weather data for clicked location:", error);
        // Tetap biarkan weather null jika gagal
      });
  };

  // Komponen untuk menangani klik pada peta
  const MapClickHandler = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  // Fungsi untuk menghapus marker
  const removeMarker = (id: number) => {
    setTempMarkers((prev) => prev.filter((marker) => marker.id !== id));
  };

  return (
    <div className="col-span-12 rounded-[10px] bg-white p-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-7">
      <div className="flex justify-between items-center mb-7">
        <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
          Region Labels & Cuaca Terkini
        </h4>
        {/* Tombol Toggle untuk Kontrol Cuaca */}
        <button
          onClick={() => setShowWeatherControls(!showWeatherControls)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none flex items-center"
        >
          {showWeatherControls ? (
            <>
              <FaCompressArrowsAlt className="mr-2" /> Sembunyikan Kontrol
            </>
          ) : (
            <>
              <FaWind className="mr-2" /> Tampilkan Kontrol
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="mb-4 p-4 text-red-600 bg-red-100 rounded">
          {error}
        </div>
      )}
      {weather && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded">
          <h5 className="font-bold">{weather.name}</h5>
          <div className="flex items-center">
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
              className="w-16 h-16"
            />
            <div className="ml-4">
              <p className="capitalize">{weather.weather[0].description}</p>
              <p>Temperatur: {weather.main.temp}°C</p>
              <p>
                Min: {weather.main.temp_min}°C | Max: {weather.main.temp_max}°C
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <strong>Kelembaban:</strong> {weather.main.humidity}%
            </div>
            <div>
              <strong>Kecepatan Angin:</strong> {weather.wind.speed} m/s
            </div>
            <div>
              <strong>Tekanan Udara:</strong> {weather.main.pressure} hPa
            </div>
            <div>
              <strong>Visibilitas:</strong> {weather.visibility / 1000} km
            </div>
          </div>
        </div>
      )}
      <div className="relative h-[600px]">
        {position ? (
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            {/* Marker utama (user location) */}
            {weather && (
              <Marker position={position}>
                <Popup>
                  <strong>{weather.name}</strong>
                  <br />
                  {weather.weather[0].description}
                  <br />
                  Temperatur: {weather.main.temp}°C
                  <br />
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                  />
                </Popup>
              </Marker>
            )}
            {/* Marker Home Button */}
            <HomeButton position={position} />
            {/* Handler klik pada peta */}
            <MapClickHandler />
            {/* Layers Control */}
            {showWeatherControls && (
              <LayersControl position="topright">
                <BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  />
                </BaseLayer>

                {/* Overlay Layers for Weather */}
                <Overlay name="Awan">
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`}
                    attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                    opacity={cloudsOpacity}
                  />
                </Overlay>
                <Overlay name="Presipitasi">
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`}
                    attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                    opacity={precipitationOpacity}
                  />
                </Overlay>
                <Overlay name="Temperatur">
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`}
                    attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                    opacity={temperatureOpacity}
                  />
                </Overlay>
                <Overlay name="Angin">
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`}
                    attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                    opacity={windOpacity}
                  />
                </Overlay>
                <Overlay name="Tekanan">
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`}
                    attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                    opacity={pressureOpacity}
                  />
                </Overlay>
              </LayersControl>
            )}
            {/* Marker sementara */}
            {tempMarkers.map((marker) => (
              <Marker key={marker.id} position={marker.position}>
                <Popup
                  eventHandlers={{
                    remove: () => {
                      // Menghapus marker ketika popup ditutup
                      removeMarker(marker.id);
                    },
                  }}
                >
                  {marker.weather ? (
                    <div className="popup-content relative">
                      {/* Tombol Close */}
                      <button
                        onClick={() => removeMarker(marker.id)}
                        className="absolute top-0 right-0 mt-1 mr-1 text-red-500 font-bold text-lg"
                      >
                        &times;
                      </button>
                      <h5 className="font-bold">{marker.weather.name}</h5>
                      <p>
                        <strong>Latitude:</strong> {marker.position[0].toFixed(4)}°
                      </p>
                      <p>
                        <strong>Longitude:</strong> {marker.position[1].toFixed(4)}°
                      </p>
                      <p>
                        <strong>Deskripsi:</strong> {marker.weather.weather[0].description}
                      </p>
                      <p>
                        <strong>Temperatur:</strong> {marker.weather.main.temp}°C
                      </p>
                      <p>
                        <strong>Kelembaban:</strong> {marker.weather.main.humidity}%
                      </p>
                      <p>
                        <strong>Kecepatan Angin:</strong> {marker.weather.wind.speed} m/s
                      </p>
                      <p>
                        <strong>Tekanan Udara:</strong> {marker.weather.main.pressure} hPa
                      </p>
                      <p>
                        <strong>Visibilitas:</strong> {marker.weather.visibility / 1000} km
                      </p>
                      <img
                        src={`https://openweathermap.org/img/wn/${marker.weather.weather[0].icon}@2x.png`}
                        alt={marker.weather.weather[0].description}
                      />
                    </div>
                  ) : (
                    <div>Memuat data cuaca...</div>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <p className="text-center">Memuat peta...</p>
        )}
      </div>

      {/* Kontrol Opacity untuk Layer Cuaca */}
      {showWeatherControls && (
        <div className="mt-4">
          <h5 className="font-bold text-dark dark:text-white mb-2">Kontrol Opacity Cuaca</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cloudsOpacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FaCloud className="inline mr-2" /> Awan
              </label>
              <input
                id="cloudsOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={cloudsOpacity}
                onChange={(e) => setCloudsOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="precipitationOpacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FaTint className="inline mr-2" /> Presipitasi
              </label>
              <input
                id="precipitationOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={precipitationOpacity}
                onChange={(e) => setPrecipitationOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="temperatureOpacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FaTemperatureHigh className="inline mr-2" /> Temperatur
              </label>
              <input
                id="temperatureOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperatureOpacity}
                onChange={(e) => setTemperatureOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="windOpacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FaWind className="inline mr-2" /> Angin
              </label>
              <input
                id="windOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={windOpacity}
                onChange={(e) => setWindOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="pressureOpacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FaCompressArrowsAlt className="inline mr-2" /> Tekanan
              </label>
              <input
                id="pressureOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={pressureOpacity}
                onChange={(e) => setPressureOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapOne;
