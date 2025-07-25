import { useState } from "react";
import { Eye, EyeOff, Leaf } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  const loginAdmin = async (e) => {
    if (e) e.preventDefault(); // prevent page reload on submit
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/admin/login", { username, password });

      if (!res.data.token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      setLoginSuccess(true);

      // Navigate after 1.5s
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || "Server error. Please try again.");
      } else if (error.request) {
        setError("No response from server. Please check your connection.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-900">
      {/* Success message pop-up */}
      <AnimatePresence>
        {loginSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <span className="font-semibold">Login Successful!</span> Redirecting to dashboard...
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="min-h-screen flex w-full">
        {/* Left side - Farm Image */}
        <motion.div
          className="hidden lg:block lg:w-1/2 relative overflow-hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img
            src="truck-login.jpg"
            alt="Transpoart"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Leaf className="w-10 h-10 text-green-200" />
              </div>
              <h1 className="text-4xl font-bold mb-4">NH Tempo Services</h1>
              <p className="text-xl opacity-90">Grow your future with Nashik Haridwar Tempo Services</p>
            </div>
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-800"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <div className="w-full max-w-md">
            {/* Logo */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/50 rounded-full mb-4">
                <Leaf className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-300">Sign in to your farm dashboard</p>
            </motion.div>

            {/* Login Form */}
            <form onSubmit={loginAdmin} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors placeholder-gray-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors placeholder-gray-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-500 bg-gray-700 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm text-green-400 hover:text-green-300">
                  Forgot password?
                </a>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </motion.button>
            </form>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <a href="mailto:akhilesh0222r@gmail.com" className="text-green-400 hover:text-green-300 font-medium">
                  Contact Administrator
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile Farm Image Overlay */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-800/20 pointer-events-none">
        <div className="absolute top-4 left-4">
          <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center">
            <Leaf className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;