const API_URL = 'http://localhost:5000/api';

// Helper pour les requêtes
async function request(endpoint, options = {}) {
  // ⭐ Chercher le token dans localStorage ET sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Une erreur est survenue');
  }

  return data;
}

// ============================================
// API AUTHENTIFICATION
// ============================================
export const authAPI = {
  // Login
  login: async (email, mot_de_passe, remember_me = false) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, mot_de_passe, remember_me }),
    });
  },

  // Signup Citoyen
  signupCitoyen: async (userData) => {
    return request('/auth/signup/citoyen', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Signup Établissement
  signupEtablissement: async (userData) => {
    return request('/auth/signup/etablissement', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Get current user
  getMe: async () => {
    return request('/auth/me');
  },

  // Mettre à jour profil
  updateProfile: async (data) => {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Changer mot de passe
  changePassword: async (data) => {
    return request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Forgot Password
  forgotPassword: async (email) => {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset Password
  resetPassword: async (token, mot_de_passe) => {
    return request(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ mot_de_passe }),
    });
  },

  // Envoyer code de vérification
  sendVerificationCode: async (email) => {
    return request('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Vérifier code
  verifyCode: async (email, code) => {
    return request('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },
};

// ============================================
// API ÉTABLISSEMENTS
// ============================================
export const etablissementsAPI = {
  // Récupérer tous les établissements actifs
  getAll: async () => {
    return request('/etablissements');
  },

  // Récupérer un établissement par ID
  getById: async (id) => {
    return request(`/etablissements/${id}`);
  },

  // Rechercher des établissements
  search: async (query) => {
    return request(`/etablissements/search?q=${encodeURIComponent(query)}`);
  },

  // Filtrer par type
  filterByType: async (type) => {
    return request(`/etablissements?type=${type}`);
  },

  // Filtrer par gouvernorat
  filterByGouvernorat: async (gouvernorat) => {
    return request(`/etablissements?gouvernorat=${encodeURIComponent(gouvernorat)}`);
  },

  // SUPER-ADMIN: Récupérer établissements en attente
  getEnAttente: async () => {
    return request('/etablissements/en-attente');
  },

  // SUPER-ADMIN: Valider un établissement
  valider: async (id) => {
    return request(`/etablissements/${id}/valider`, {
      method: 'PUT',
    });
  },

  // SUPER-ADMIN: Rejeter un établissement
  rejeter: async (id, raison) => {
    return request(`/etablissements/${id}/rejeter`, {
      method: 'PUT',
      body: JSON.stringify({ raison }),
    });
  },

  // SUPER-ADMIN: Suspendre un établissement
  suspendre: async (id, raison) => {
    return request(`/etablissements/${id}/suspendre`, {
      method: 'PUT',
      body: JSON.stringify({ raison }),
    });
  },

  // SUPER-ADMIN: Activer un établissement
  activer: async (id) => {
    return request(`/etablissements/${id}/activer`, {
      method: 'PUT',
    });
  },

  // ADMIN: Modifier son établissement
  update: async (id, data) => {
    return request(`/etablissements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// API SERVICES
// ============================================
export const servicesAPI = {
  // Récupérer les services d'un établissement
  getByEtablissement: async (etablissementId) => {
    return request(`/services/etablissement/${etablissementId}`);
  },

  // Récupérer un service par ID
  getById: async (id) => {
    return request(`/services/${id}`);
  },

  // Stats publiques d'un service
  getStats: async (serviceId) => {
    return request(`/services/${serviceId}/stats`);
  },

  // ADMIN: Créer un service
  create: async (serviceData) => {
    return request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  // ADMIN: Modifier un service
  update: async (id, data) => {
    return request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ADMIN: Supprimer un service
  delete: async (id) => {
    return request(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  // ADMIN: Activer/Désactiver un service
  toggleActif: async (id) => {
    return request(`/services/${id}/toggle`, {
      method: 'PUT',
    });
  },
};

// ============================================
// API TICKETS
// ============================================
export const ticketsAPI = {
  // CITOYEN: Créer un ticket
  create: async (ticketData) => {
    return request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },

  // CITOYEN: Mes tickets actifs
  getMesTickets: async () => {
    return request('/tickets/mes-tickets');
  },

  // CITOYEN: Suivre un ticket
  getById: async (id) => {
    return request(`/tickets/${id}`);
  },

  // CITOYEN: Annuler un ticket
  cancel: async (id) => {
    return request(`/tickets/${id}`, {
      method: 'DELETE',
    });
  },

  // AGENT: Récupérer tickets de mon service
  getByService: async (serviceId) => {
    return request(`/tickets/service/${serviceId}`);
  },

  // AGENT: Appeler le prochain ticket
  appelerSuivant: async (serviceId) => {
    return request(`/tickets/service/${serviceId}/appeler-suivant`, {
      method: 'PUT',
    });
  },

  // AGENT: Marquer ticket comme servi
  marquerServi: async (id) => {
    return request(`/tickets/${id}/servi`, {
      method: 'PUT',
    });
  },

  // AGENT: Marquer ticket comme absent
  marquerAbsent: async (id) => {
    return request(`/tickets/${id}/absent`, {
      method: 'PUT',
    });
  },

  // ADMIN: Stats tickets de l'établissement
  getStats: async (etablissementId, dateDebut, dateFin) => {
    return request(`/tickets/stats/${etablissementId}?dateDebut=${dateDebut}&dateFin=${dateFin}`);
  },
};

// ============================================
// API RENDEZ-VOUS
// ============================================
export const rdvAPI = {
  // CITOYEN: Récupérer créneaux disponibles
  getCreneaux: async (serviceId, date) => {
    return request(`/rendezvous/creneaux?serviceId=${serviceId}&date=${date}`);
  },

  // CITOYEN: Créer un rendez-vous
  create: async (rdvData) => {
    return request('/rendezvous', {
      method: 'POST',
      body: JSON.stringify(rdvData),
    });
  },

  // CITOYEN: Récupérer un RDV par ID
  getById: async (id) => {
    return request(`/rendezvous/${id}`);
  },

  // CITOYEN: Mes rendez-vous
  getMesRDV: async () => {
    return request('/rendezvous/mes-rdv');
  },

  // CITOYEN: Annuler un rendez-vous
  cancel: async (id) => {
    return request(`/rendezvous/${id}`, {
      method: 'DELETE',
    });
  },

  // CITOYEN: Reprogrammer un rendez-vous
  reschedule: async (id, data) => {
    return request(`/rendezvous/${id}/reprogrammer`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // AGENT: Récupérer RDV de mon service
  getByService: async (serviceId, date) => {
    return request(`/rendezvous/service/${serviceId}?date=${date}`);
  },

  // AGENT: Marquer RDV comme complété
  marquerComplete: async (id) => {
    return request(`/rendezvous/${id}/complete`, {
      method: 'PUT',
    });
  },

  // AGENT: Marquer RDV comme absent
  marquerAbsent: async (id) => {
    return request(`/rendezvous/${id}/absent`, {
      method: 'PUT',
    });
  },

  // ADMIN: Configurer horaires service
  configurerHoraires: async (serviceId, horaires) => {
    return request(`/rendezvous/service/${serviceId}/horaires`, {
      method: 'PUT',
      body: JSON.stringify({ horaires }),
    });
  },

  // ADMIN: Stats RDV de l'établissement
  getStats: async (etablissementId, dateDebut, dateFin) => {
    return request(`/rendezvous/stats/${etablissementId}?dateDebut=${dateDebut}&dateFin=${dateFin}`);
  },
};

// ============================================
// API AGENTS
// ============================================
export const agentsAPI = {
  // ADMIN: Récupérer agents de l'établissement
  getByEtablissement: async (etablissementId) => {
    return request(`/agents/etablissement/${etablissementId}`);
  },

  // ADMIN: Créer un agent
  create: async (agentData) => {
    return request('/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  },

  // ADMIN: Modifier un agent
  update: async (id, data) => {
    return request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ADMIN: Supprimer un agent
  delete: async (id) => {
    return request(`/agents/${id}`, {
      method: 'DELETE',
    });
  },

  // ADMIN: Assigner agent à un service
  assignerService: async (agentId, serviceId) => {
    return request(`/agents/${agentId}/assigner-service`, {
      method: 'PUT',
      body: JSON.stringify({ serviceId }),
    });
  },
};

// ============================================
// API NOTIFICATIONS
// ============================================
export const notificationsAPI = {
  // Récupérer mes notifications
  getMine: async () => {
    return request('/notifications');
  },

  // Marquer comme lu
  markAsRead: async (id) => {
    return request(`/notifications/${id}/lire`, {
      method: 'PUT',
    });
  },

  // Marquer toutes comme lues
  markAllAsRead: async () => {
    return request('/notifications/tout-lire', {
      method: 'PUT',
    });
  },

  // Supprimer une notification
  delete: async (id) => {
    return request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// API STATISTIQUES
// ============================================
export const statsAPI = {
  // ADMIN: Dashboard établissement
  getDashboardEtablissement: async (etablissementId) => {
    return request(`/stats/etablissement/${etablissementId}/dashboard`);
  },

  // SUPER-ADMIN: Dashboard plateforme
  getDashboardPlateforme: async () => {
    return request('/stats/plateforme/dashboard');
  },

  // ADMIN: Stats détaillées
  getDetailed: async (etablissementId, dateDebut, dateFin) => {
    return request(`/stats/etablissement/${etablissementId}?dateDebut=${dateDebut}&dateFin=${dateFin}`);
  },
};

// Export default pour faciliter l'import
export default {
  auth: authAPI,
  etablissements: etablissementsAPI,
  services: servicesAPI,
  tickets: ticketsAPI,
  rdv: rdvAPI,
  agents: agentsAPI,
  notifications: notificationsAPI,
  stats: statsAPI,
};