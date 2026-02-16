import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface HealthResponse {
  status: string
  service: string
  version: string
  environment: string
}

export function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Spanner CRM
        </h1>

        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking system status...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {health && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">System Healthy</h3>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Service:</dt>
                  <dd className="font-medium text-gray-900">{health.service}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Version:</dt>
                  <dd className="font-medium text-gray-900">{health.version}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Environment:</dt>
                  <dd className="font-medium text-gray-900">{health.environment}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Status:</dt>
                  <dd className="font-medium text-green-600 capitalize">{health.status}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Welcome to Spanner CRM. The application infrastructure is ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
