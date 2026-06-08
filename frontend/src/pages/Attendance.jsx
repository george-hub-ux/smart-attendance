import React, { useEffect, useState } from 'react'
import axios from 'axios'

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Attendance(){
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [geofence, setGeofence] = useState(null);
  const [locationState, setLocationState] = useState(null);

  useEffect(() => {
    const loadGeofence = async () => {
      try {
        const res = await axios.get('/api/attendance/geofence');
        setGeofence(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadGeofence();
  }, []);

  const doCheckin = () => {
    setLoading(true);
    setMessage(null);
    if (!navigator.geolocation) {
      setMessage('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        if (geofence && geofence.radius) {
          const dist = getDistanceMeters(latitude, longitude, geofence.latitude, geofence.longitude);
          if (dist > geofence.radius) {
            setMessage('Attendance can only be marked within Swahilipot Hub Foundation premises. Please move inside the allowed area.');
            setLocationState({ latitude, longitude, distance: dist, allowed: false });
            setLoading(false);
            return;
          }
          setLocationState({ latitude, longitude, distance: dist, allowed: true });
        }

        const payload = {
          full_name: 'Demo User',
          email: 'demo@example.com',
          phone_number: '',
          latitude,
          longitude
        };
        const res = await axios.post('/api/attendance/checkin/public', payload);
        setMessage('Attendance recorded successfully.');
      } catch (err) {
        setMessage(err.response?.data?.message || 'Checkin failed');
      } finally { setLoading(false); }
    }, (err) => {
      setMessage('Unable to get location: ' + err.message);
      setLoading(false);
    }, { enableHighAccuracy: true, timeout: 15000 });
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
      <p className="mb-4">Click the button to mark your attendance within the Swahilipot Hub Foundation premises.</p>
      <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={doCheckin} disabled={loading}>{loading ? 'Checking...' : 'Present'}</button>
      {geofence && geofence.radius > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          Geofence radius: {geofence.radius} meters around the foundation location.
        </div>
      )}
      {locationState && (
        <div className={`mt-3 text-sm ${locationState.allowed ? 'text-green-600' : 'text-red-600'}`}>
          {locationState.allowed ? 'Within allowed radius.' : `Outside radius by ${Math.round(locationState.distance - (geofence?.radius || 0))} meters.`}
        </div>
      )}
      {message && <div className="mt-4 text-sm text-red-600">{message}</div>}
    </div>
  )
}
