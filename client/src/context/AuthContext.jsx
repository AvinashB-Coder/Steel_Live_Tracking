import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Admin email configuration
const ADMIN_EMAIL = 'babuavinash2006@gmail.com';

// Role permissions configuration
const ROLE_PERMISSIONS = {
  admin: {
    canViewDashboard: true,
    canManageTrips: true,
    canManageUsers: true,
    canManageTools: true,
    canViewLiveLocation: true,
    canManageDrivers: true,
    canViewReports: true,
  },
  employee: {
    canViewDashboard: true,
    canManageTrips: false,
    canManageUsers: false,
    canManageTools: true,
    canViewLiveLocation: true,
    canManageDrivers: true,
    canViewReports: true,
  },
  vendor: {
    canViewDashboard: true,
    canManageTrips: false,
    canManageUsers: false,
    canManageTools: false,
    canViewLiveLocation: true,
    canManageDrivers: false,
    canViewReports: false,
  },
  driver: {
    canViewDashboard: true,
    canManageTrips: false,
    canManageUsers: false,
    canManageTools: false,
    canViewLiveLocation: true,
    canManageDrivers: false,
    canViewReports: false,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      // Override role to admin if email matches admin email
      if (parsedUser.email === ADMIN_EMAIL) {
        parsedUser.role = 'admin';
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    // Override role to admin if email matches admin email
    if (userData.email === ADMIN_EMAIL) {
      userData.role = 'admin';
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (userData) => {
    // Override role to admin if email matches admin email
    if (userData.email === ADMIN_EMAIL) {
      userData.role = 'admin';
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role]?.[permission] || false;
  };

  const isRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    loading,
    login,
    updateUser,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    isRole,
    isAdmin: user?.email === ADMIN_EMAIL,
    ROLE_PERMISSIONS,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
