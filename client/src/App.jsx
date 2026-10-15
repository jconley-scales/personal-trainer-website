import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Services from "./pages/Services.jsx";
import Booking from "./pages/Booking.jsx";
import ManageBooking from "./pages/ManageBooking.jsx";
import Contact from "./pages/Contact.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <>
      {/* Skip link: the very first focusable element, lets keyboard and
          screen-reader users bypass the header/nav and land on page
          content directly. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Nav />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/my-appointments" element={<ManageBooking />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <div className="container section">
                <h1>Page Not Found</h1>
                <p>Sorry, we couldn't find that page. Use the menu above to find what you're looking for.</p>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
