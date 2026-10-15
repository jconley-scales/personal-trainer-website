import { Link } from "react-router-dom";

// Large, readable cards: generous padding, big touch-friendly button, and
// price/duration called out with clear labels rather than icons/symbols
// alone (e.g. not just "$75" with no context).
export default function ServiceCard({ service, showBookButton = true }) {
  return (
    <article className="card stack--tight" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h3 style={{ margin: 0 }}>{service.name}</h3>
      <p style={{ margin: 0 }}>{service.description || service.shortDescription}</p>
      <p style={{ margin: 0, fontWeight: 700 }}>
        Price: ${service.price} ({service.priceUnit}) &nbsp;|&nbsp; Duration: {service.duration}
      </p>
      {showBookButton && (
        <Link
          to={`/booking?service=${encodeURIComponent(service.id)}`}
          className="btn btn--primary"
          style={{ alignSelf: "flex-start" }}
        >
          Book This Service
        </Link>
      )}
    </article>
  );
}
