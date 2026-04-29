import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⭐ Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = () => {
      // ⭐ Chercher dans localStorage ET sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Erreur parsing user:', error);
          // Nettoyer les storages si erreur
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, mot_de_passe, remember_me = false) => {
    try {
      const response = await authAPI.login(email, mot_de_passe, remember_me);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // ⭐ SI "Se souvenir de moi" = true → localStorage (reste après fermeture)
        // ⭐ SI "Se souvenir de moi" = false → sessionStorage (effacé à la fermeture)
        if (remember_me) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          // ⭐ Nettoyer sessionStorage
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
          // ⭐ Nettoyer localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        // Mettre à jour le state
        setUser(user);
        
        return { success: true, user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Erreur login:', error);
      return { success: false, message: error.message, code: error.code, userId: error.userId };
    }
  };

  // Logout
  const logout = () => {
    // ⭐ Nettoyer les deux storages
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  // Signup Citoyen — retourne userId/email pour la page de vérification
  const signupCitoyen = async (userData) => {
    try {
      const response = await authAPI.signupCitoyen(userData);

      if (response.success) {
        return { success: true, userId: response.data.userId, email: response.data.email };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Erreur signup:', error);
      return { success: false, message: error.message };
    }
  };

  // Vérifier email avec code OTP
  const verifierEmail = async (userId, code) => {
    try {
      const response = await authAPI.verifyEmail(userId, code);

      if (response.success && response.data?.token) {
        // Citoyen → auto-login
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true, user, autoLogin: true };
      }

      return { success: response.success, message: response.message, autoLogin: false };
    } catch (error) {
      console.error('Erreur vérification email:', error);
      return { success: false, message: error.message };
    }
  };

  // Renvoyer code de vérification
  const renvoyerCode = async (userId) => {
    try {
      const response = await authAPI.resendCode(userId);
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Signup Établissement
  const signupEtablissement = async (userData) => {
    try {
      const response = await authAPI.signupEtablissement(userData);

      if (response.success) {
        return { success: true, message: response.message, userId: response.data?.userId, email: response.data?.email };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Erreur signup établissement:', error);
      return { success: false, message: error.message };
    }
  };

  // ⭐ Mettre à jour user
  const updateUser = (newUserData) => {
    setUser(newUserData);
    
    // ⭐ Mettre à jour dans le bon storage
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(newUserData));
    } else if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(newUserData));
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signupCitoyen,
    signupEtablissement,
    verifierEmail,
    renvoyerCode,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalisé
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}