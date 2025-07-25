import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./Store/store"; // Import the Redux store
import axios from "axios";

import Login from "./Pages/Login";
import AdminDashboard from "./Pages/Dashboard";
import ProtectedRoute from "./Components/ProtectedRoute";

// Set base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL; // Adjust this to your backend URL

const App = () => {
  useEffect(() => {
    // Check for token on app load and set axios header
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect to login by default */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
