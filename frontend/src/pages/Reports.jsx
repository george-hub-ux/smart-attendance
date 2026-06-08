import React, { useState } from 'react'
import api from '../api'

export default function Reports(){
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [format, setFormat] = useState('json');
  const [result, setResult] = useState(null);

  const fetchReport = async () => {
    try{
      const res = await api.get('/api/reports/daily', { params: { date, format } , responseType: format === 'json' ? 'json' : 'blob' });
      if (format === 'json') setResult(res.data);
      else {
        // download blob
        const blob = new Blob([res.data], { type: res.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-report-${date}.${format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf'}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    }catch(err){
      console.error(err);
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      <div className="mb-4">
        <label className="block mb-1">Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="p-2 border rounded" />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Format</label>
        <select value={format} onChange={e=>setFormat(e.target.value)} className="p-2 border rounded">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
      <div><button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={fetchReport}>Generate</button></div>

      {result && (
        <pre className="mt-4 max-h-64 overflow-auto text-sm bg-gray-50 p-2">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}
