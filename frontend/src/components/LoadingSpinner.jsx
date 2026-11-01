/**
 * LoadingSpinner — centred loading indicator
 */
export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      {message && <p className="spinner-msg">{message}</p>}
    </div>
  );
}
