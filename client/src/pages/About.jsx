import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="container section stack">
      <h1>About Me</h1>

      <div className="hero" style={{ alignItems: "start" }}>
        <div className="stack">
          <p className="prose">
            Hi, I'm Jamie Rivera, the trainer and owner behind Bright Path
            Personal Training. I started this business because I saw too
            many people told that fitness "wasn't for them" once they hit
            their 50s, 60s, or 70s. I believe the opposite: this stage of
            life is exactly when strength, balance, and mobility work
            matters most, and it's never too late to start.
          </p>
          <p className="prose">
            My approach is simple: listen first, move carefully, and build
            confidence one session at a time. Whether your goal is playing
            with your grandkids without knee pain, getting back to hiking,
            or simply feeling steadier on your feet, we'll get there
            together, at a pace that respects your body.
          </p>
        </div>
        <div className="hero__photo-placeholder" role="img" aria-label="Photo of Jamie Rivera coming soon">
          Trainer Photo Placeholder
        </div>
      </div>

      <section className="stack">
        <h2>Certifications</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>NASM Certified Personal Trainer (CPT)</li>
          <li>Senior Fitness Specialist Certification (SFS)</li>
          <li>Certified in CPR / AED (current)</li>
          <li>Balance &amp; Fall Prevention Specialist</li>
        </ul>
      </section>

      <section className="stack">
        <h2>Experience</h2>
        <p className="prose">
          Over 15 years of experience helping adults of all fitness levels
          build strength safely, with the last 8 years focused specifically
          on training clients aged 50 and older.
        </p>
      </section>

      <section className="stack">
        <h2>My Philosophy</h2>
        <p className="prose">
          Fitness should meet you where you are, not the other way around.
          There's no judgment here, no extreme workouts, and no pressure -
          just steady, encouraging guidance and a plan built around what
          your body needs today.
        </p>
      </section>

      <div>
        <Link to="/booking" className="btn btn--primary btn--large">
          Book a Session
        </Link>
      </div>
    </div>
  );
}
