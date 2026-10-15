import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <section className="section container">
        <div className="hero">
          <div className="stack">
            <h1>Personal Training Built Around You</h1>
            <p className="prose">
              Friendly, patient, one-on-one fitness coaching for adults 50 and
              up. Whether you're just getting started, recovering from an
              injury, or want to stay strong and steady for years to come,
              we'll build a plan that fits your body, your goals, and your
              pace.
            </p>
            <div className="badge-row" aria-label="Highlights">
              <span className="badge">15+ Years Experience</span>
              <span className="badge">Certified Senior Fitness Specialist</span>
              <span className="badge">In-Studio &amp; In-Home Sessions</span>
            </div>
            <div>
              <Link to="/booking" className="btn btn--primary btn--large">
                Book a Session
              </Link>
            </div>
          </div>

          {/* Placeholder for the trainer's photo. Replace the div below with
              an <img src="..." alt="..."> once you have a real photo -
              remember to write real, descriptive alt text. */}
          <div className="hero__photo-placeholder" role="img" aria-label="Photo of your trainer coming soon">
            Trainer Photo Placeholder
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container stack">
          <h2>Why Clients Choose Bright Path</h2>
          <div className="grid">
            <div className="card">
              <h3>Personal, Unhurried Attention</h3>
              <p>Every session is one-on-one. No rushing, no crowded classes - just you and your trainer.</p>
            </div>
            <div className="card">
              <h3>Trained for Your Stage of Life</h3>
              <p>Programs designed specifically around strength, balance, mobility, and safety for adults 50+.</p>
            </div>
            <div className="card">
              <h3>Simple, Flexible Booking</h3>
              <p>Book online in a few clicks, or call and we'll happily book it for you over the phone.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stack" style={{ alignItems: "flex-start" }}>
          <h2>Ready to Get Started?</h2>
          <p className="prose">
            Booking your first session takes about two minutes. Choose a
            service, pick a time that works for you, and you're all set.
          </p>
          <Link to="/booking" className="btn btn--primary btn--large">
            Book a Session
          </Link>
        </div>
      </section>
    </>
  );
}
