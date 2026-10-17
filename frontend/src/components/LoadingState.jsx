import { FiRefreshCw } from 'react-icons/fi'

export default function LoadingState({ title = 'Loading data', detail = 'Fetching the latest workspace information.' }) {
  return <div className="data-loading-state" role="status" aria-live="polite">
    <span className="data-loading-spinner"><FiRefreshCw /></span>
    <strong>{title}</strong>
    <p>{detail}</p>
  </div>
}
