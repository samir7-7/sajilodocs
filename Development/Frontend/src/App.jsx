import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function Home() {
  return (
    <div className="home">
      <h1>Welcome to Document Manager</h1>
      <p>
        Go ahead and <NavLink to="/login">login</NavLink> or{" "}
        <NavLink to="/signup">sign up</NavLink>.
      </p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-shell">
        <header className="app-header">
          <nav>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/signup">Sign up</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
