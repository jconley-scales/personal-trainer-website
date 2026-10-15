import { useEffect, useState } from "react";
import { api } from "../api.js";
import ServiceCard from "../components/ServiceCard.jsx";

export default function Services() {
  const [services, setServices] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getServices()
      .then(setServices)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="container section stack">
      <h1>Services &amp; Pricing</h1>
      <p className="prose">
        All sessions are one-on-one unless noted otherwise. Not sure which
        service is right for you? Give us a call and we're happy to help
        you choose.
      </p>

      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {!services && !error && <p>Loading services...</p>}

      {services && (
        <div className="grid">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
