export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container stack--tight" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={{ margin: 0, fontWeight: 700 }}>Bright Path Personal Training</p>
        <p style={{ margin: 0 }}>
          Call or text{" "}
          <a href="tel:+15551234567">(555) 123-4567</a> &nbsp;|&nbsp;
          Email <a href="mailto:hello@brightpathtraining.example">hello@brightpathtraining.example</a>
        </p>
        <p style={{ margin: 0 }}>
          <a href="/admin">Admin Login</a>
        </p>
      </div>
    </footer>
  );
}
