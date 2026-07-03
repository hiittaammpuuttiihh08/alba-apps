import "./loading.css";

export default function Loading({ message = "Memuat...", size = "medium" }) {
  return (
    <div className={`loading loading--${size}`}>
      <div className="loading__spinner" />
      <div className="loading__message">{message}</div>
    </div>
  );
}
