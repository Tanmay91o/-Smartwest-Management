import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Login from './components/Login'
import signup from './components/Signup'
import Signup from './components/Signup'

const API_URL = "https://smartwest-management.onrender.com"

// to get transaction from local storage
const getTransectionsFromStorage = () => {
  const saved = localStorage.getItem("transections")
  return saved ? JSON.parse(saved) : []
}

// to protect the route
const ProtectedRoute = ({ user, children }) => {
  const localToken = localStorage.getItem("token")
  const sessionToken = sessionStorage.getItem("token")
  const hasToken = localToken || sessionToken
  if (!user || !hasToken) {
    return <Navigate to="/login" replace />
  }
  return children
}

// to scroll top page gets relode new page is visited
const ScrollToTop = () => {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [location.pathname])
  return null
}

const App = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [transections, setTransections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // save the token
  const persistAuth = (userObj, tokenStr, remember = false) => {
    try {
      if (remember) {
        if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) localStorage.setItem("token", tokenStr);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        if (userObj) sessionStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) sessionStorage.setItem("token", tokenStr);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      setUser(userObj || null);
      setToken(tokenStr || null);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  };

  const clearAuth = () => {
    try {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      sessionStorage.removeItem("user")
      sessionStorage.removeItem("token")
    } catch (err) {
      console.error("clearAuth error:", err);
    }
    setUser(null)
    setToken(null)
  }

  // to update user data both state and storage
  const updateUserData = (updatedUser) => {
    setUser(updatedUser)
    const localToken = localStorage.getItem("token")
    const sessionToken = sessionStorage.getItem("token")
    if (localToken) {
      localStorage.setItem("user", JSON.stringify(updatedUser))
    } else if (sessionToken) {
      sessionStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  // try to load user token when mounted
  useEffect(() => {
    (async () => {
      try {
        const localUserRaw = localStorage.getItem("user")
        const sessionUserRaw = sessionStorage.getItem("user")

        const localToken = localStorage.getItem("token")
        const sessionToken = sessionStorage.getItem("token")

        const storedUser = localUserRaw ? JSON.parse(localUserRaw) : sessionUserRaw ?
          JSON.parse(sessionUserRaw) : null

        const storedToken = localToken || sessionToken || null
        const tokenFromLocal = !!localToken

        if (storedUser) {
          setUser(storedUser)
          setToken(storedToken)
          setIsLoading(false)
          return
        }

        if (storedToken) {
          try {
            const res = await axios.get(`${API_URL}/api/user/me`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            })
            const profile = res.data
            persistAuth(profile, storedToken, tokenFromLocal)
          } catch (fetchErr) {
            console.warn("could not fetch profile");
            fetchErr
          }
          clearAuth()
        }
      } catch (err) {
        console.error("error bootstrapping auth", err);
      } finally {
        setIsLoading(false)
        try {
          setTransections(getTransectionsFromStorage())
        } catch (txErr) {
          console.error("error loding Transections:", txErr);
        }
      }
    })()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("transactions", JSON.stringify(transections))
    } catch (err) {
      console.error("error saving transections:", err);
    }
  }, [transections])

  const handleLogin = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember)
    navigate('/')
  }

  const handleSignup = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember)
    navigate('/')
  }

  const handleLogout = () => {
    clearAuth()
    navigate("/login")
  }

  // transaction helpers
  const addTransaction = (newTransaction) =>
    setTransactions((p) => [newTransaction, ...p]);
  const editTransaction = (id, updatedTransaction) =>
    setTransactions((p) =>
      p.map((t) => (t.id === id ? { ...updatedTransaction, id } : t)),
    );
  const deleteTransaction = (id) =>
    setTransactions((p) => p.filter((t) => t.id !== id));
  const refreshTransactions = () =>
    setTransactions(getTransactionsFromStorage());


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
        < Route element={
          <ProtectedRoute user={user}>
            <Layout user={user}
              onLogin={handleLogout}
              transections={transections}
              addTransaction={addTransaction}
              editTransaction={editTransaction}
              deleteTransaction={deleteTransaction}
              refreshTransactions={refreshTransactions}
            />
          </ProtectedRoute>}>

          <Route path="/" element={<Dashboard />}
            transections={transections}
            addTransaction={addTransaction}
            editTransaction={editTransaction}
            deleteTransaction={deleteTransaction}
            refreshTransactions={refreshTransactions}
          />

        </Route>
      </Routes>
    </>
  )
}

export default App
