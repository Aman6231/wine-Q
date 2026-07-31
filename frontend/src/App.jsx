import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:8000')
).replace(/\/$/, '')

const FIELD_CONFIG = [
  { key: 'fixed_acidity', label: 'Fixed Acidity', type: 'number', step: 'any' },
  { key: 'volatile_acidity', label: 'Volatile Acidity', type: 'number', step: 'any' },
  { key: 'citric_acid', label: 'Citric Acid', type: 'number', step: 'any' },
  { key: 'residual_sugar', label: 'Residual Sugar', type: 'number', step: 'any' },
  { key: 'chlorides', label: 'Chlorides', type: 'number', step: 'any' },
  { key: 'free_sulfur_dioxide', label: 'Free Sulfur Dioxide', type: 'number', step: 'any' },
  { key: 'total_sulfur_dioxide', label: 'Total Sulfur Dioxide', type: 'number', step: 'any' },
  { key: 'density', label: 'Density', type: 'number', step: 'any' },
  { key: 'pH', label: 'pH', type: 'number', step: 'any' },
  { key: 'sulphates', label: 'Sulphates', type: 'number', step: 'any' },
  { key: 'alcohol', label: 'Alcohol', type: 'number', step: 'any' },
  { key: 'Id', label: 'Sample ID', type: 'number', step: '1' },
]

const INITIAL_FORM = FIELD_CONFIG.reduce((acc, field) => {
  acc[field.key] = ''
  return acc
}, {})

function App() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const [predictionResult, setPredictionResult] = useState(null)
  const [predictions, setPredictions] = useState([])

  const endpointLabel = useMemo(() => API_BASE_URL || 'Same origin', [])

  const fetchHistory = async () => {
    setIsLoadingHistory(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/predictions`)
      if (!response.ok) {
        throw new Error('Could not load prediction history.')
      }
      const payload = await response.json()
      setPredictions(payload.data ?? [])
    } catch (err) {
      setError(err.message || 'Could not load prediction history.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const parsePayload = () => {
    const payload = {}
    for (const field of FIELD_CONFIG) {
      if (formData[field.key] === '') {
        throw new Error(`Please provide ${field.label}.`)
      }
      payload[field.key] =
        field.key === 'Id' ? Number.parseInt(formData[field.key], 10) : Number(formData[field.key])
      if (Number.isNaN(payload[field.key])) {
        throw new Error(`${field.label} must be a valid number.`)
      }
    }
    return payload
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setPredictionResult(null)
    setError('')
    setIsSubmitting(true)
    try {
      const payload = parsePayload()
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Prediction request failed.')
      }
      const result = await response.json()
      setPredictionResult(result.predicted_quality)
      await fetchHistory()
    } catch (err) {
      setError(err.message || 'Prediction request failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <header>
        <h1>Wine Quality Predictor</h1>
        <p>Backend API: {endpointLabel}</p>
      </header>

      <section className="card">
        <h2>Submit a Sample</h2>
        <form onSubmit={handleSubmit} className="grid-form">
          {FIELD_CONFIG.map((field) => (
            <label key={field.key} className="field">
              <span>{field.label}</span>
              <input
                type={field.type}
                step={field.step}
                name={field.key}
                value={formData[field.key]}
                onChange={handleInputChange}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            </label>
          ))}
          <button className="submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Predicting...' : 'Predict Quality'}
          </button>
        </form>
      </section>

      {predictionResult !== null ? (
        <section className="card result-card">
          <h2>Latest Prediction</h2>
          <p className="result">Predicted quality: {predictionResult}</p>
        </section>
      ) : null}

      {error ? (
        <section className="card error-card">
          <p>{error}</p>
        </section>
      ) : null}

      <section className="card">
        <h2>Prediction History</h2>
        {isLoadingHistory ? (
          <p>Loading prediction history...</p>
        ) : predictions.length === 0 ? (
          <p>No predictions saved yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Alcohol</th>
                  <th>pH</th>
                  <th>Sulphates</th>
                  <th>Predicted Quality</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((row, index) => (
                  <tr key={`${row.Id}-${index}`}>
                    <td>{row.Id}</td>
                    <td>{row.alcohol}</td>
                    <td>{row.pH}</td>
                    <td>{row.sulphates}</td>
                    <td>{row.wine_quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
