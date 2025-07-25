import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: null,
    isAdmin: null,
    isLoading: true,
    error: null
  });
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          error: "No authentication token found"
        });
        return;
      }

      try {
        console.log("ProtectedRoute: Verifying token");
        
        // Set authorization header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Verify token with backend
        const response = await axios.get("/api/admin/verify");
        console.log("ProtectedRoute: Verification response", response.data);
        
        // Check if user has admin role
        const isAdmin = response.data.user.role === "admin";
        
        setAuthState({
          isAuthenticated: true,
          isAdmin,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error("ProtectedRoute: Authentication error", error);
        
        localStorage.removeItem("token");
        
        let errorMessage = "Authentication failed";
        if (error.response) {
          errorMessage = error.response.data.message || errorMessage;
        }
        
        setAuthState({
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          error: errorMessage
        });
      }
    };

    verifyAuth();
  }, []);

  if (authState.isLoading) {
    // Still checking authentication
    return <div className="loading">Verifying access...</div>;
  }

  if (!authState.isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!authState.isAdmin) {
    // Redirect to login if not an admin
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
          <button onClick={() => window.location.href = "/login"}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Render children if authenticated and is admin
  return children;
};

export default ProtectedRoute;