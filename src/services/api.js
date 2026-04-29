const API_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
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

  // Lire le body une seule fois — gérer les réponses non-JSON (HTML d'erreur Express)
  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: `Erreur serveur (${response.status})`, raw: text };
  }

  if (!response.ok) {
    // Token expiré ou invalide → déconnexion automatique
    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      // Rediriger vers login si pas déjà dessus
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify')) {
        window.location.href = '/login';
      }
    }
    const error = new Error(data.message || 'Une erreur est survenue');
    error.code = data.code;
    error.userId = data.userId;
    error.status = response.status;
    throw error;
  }

  return data;
}

// ============================================
// API AUTHENTIFICATION
// ============================================
export const authAPI = {
  login: async (email, mot_de_passe, remember_me = false) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, mot_de_passe, remember_me }),
    });
  },

  signupCitoyen: async (userData) => {
    return request('/auth/signup/citoyen', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  signupEtablissement: async (userData) => {
    return request('/auth/signup/etablissement', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return request('/auth/me');
  },

  updateProfile: async (data) => {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data) => {
    return request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  uploadPhotoProfil: async (file) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const formData = new FormData();
    formData.append('photo', file);
    const response = await fetch(`${API_URL}/auth/upload-photo`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erreur upload');
    return data;
  },

  forgotPassword: async (email) => {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token, mot_de_passe) => {
    return request(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ mot_de_passe }),
    });
  },

  sendVerificationCode: async (email) => {
    return request('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyCode: async (email, code) => {
    return request('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  verifyEmail: async (userId, code) => {
    return request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ userId, code }),
    });
  },

  resendCode: async (userId) => {
    return request('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  checkAgentSetupToken: async (token) => {
    return request(`/auth/agent-setup/${token}`);
  },

  agentSetupPassword: async (token, mot_de_passe) => {
    return request(`/auth/agent-setup/${token}`, {
      method: 'POST',
      body: JSON.stringify({ mot_de_passe }),
    });
  },
};

// ============================================
// API ÉTABLISSEMENTS
// ============================================
export const etablissementsAPI = {
  // Public - établissements actifs uniquement
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/etablissements${query ? '?' + query : ''}`);
  },

  getById: async (id) => {
    return request(`/etablissements/${id}`);
  },

  search: async (query) => {
    return request(`/etablissements?search=${encodeURIComponent(query)}`);
  },

  filterByType: async (type) => {
    return request(`/etablissements?type=${type}`);
  },

  filterByGouvernorat: async (gouvernorat) => {
    return request(`/etablissements?gouvernorat=${encodeURIComponent(gouvernorat)}`);
  },

  // SUPER-ADMIN: Tous les établissements (tous statuts)
  getAllAdmin: async (statut = '') => {
    return request(`/etablissements/tous${statut ? '?statut=' + statut : ''}`);
  },

  // SUPER-ADMIN: Établissements en attente
  getEnAttente: async () => {
    return request('/etablissements/en-attente');
  },

  // SUPER-ADMIN: Actions
  valider: async (id) => {
    return request(`/etablissements/${id}/valider`, { method: 'PUT' });
  },

  rejeter: async (id, raison) => {
    return request(`/etablissements/${id}/rejeter`, {
      method: 'PUT',
      body: JSON.stringify({ raison }),
    });
  },

  suspendre: async (id, raison) => {
    return request(`/etablissements/${id}/suspendre`, {
      method: 'PUT',
      body: JSON.stringify({ raison }),
    });
  },

  activer: async (id) => {
    return request(`/etablissements/${id}/activer`, { method: 'PUT' });
  },

  supprimer: async (id) => {
    return request(`/etablissements/${id}`, { method: 'DELETE' });
  },

  // Upload photo établissement
  uploadPhotoEtablissement: async (file) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const formData = new FormData();
    formData.append('photo', file);
    const response = await fetch(`${API_URL}/etablissements/me/photo`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erreur upload');
    return data;
  },

  // Upload documents (vrais fichiers, public lors de l'inscription)
  uploadDocuments: async (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('documents', f.file));
    const response = await fetch(`${API_URL}/etablissements/upload-documents`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erreur upload');
    return data;
  },

  // ADMIN: Mon établissement
  getMonEtablissement: async () => {
    return request('/etablissements/me/etablissement');
  },

  update: async (data) => {
    return request('/etablissements/me/etablissement', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // CITOYEN — signaler un établissement
  signaler: async (id, raison, commentaire) => {
    return request(`/etablissements/${id}/signaler`, {
      method: 'POST',
      body: JSON.stringify({ raison, commentaire }),
    });
  },

  // SUPER ADMIN — signalements
  getSignales: async () => {
    return request('/etablissements/signales');
  },

  getSignalements: async (id) => {
    return request(`/etablissements/${id}/signalements`);
  },

  reinitialiserSignalements: async (id) => {
    return request(`/etablissements/${id}/signalements`, { method: 'DELETE' });
  },
};

// ============================================
// API SERVICES
// ============================================
export const servicesAPI = {
  getByEtablissement: async (etablissementId) => {
    return request(`/services/etablissement/${etablissementId}`);
  },

  getById: async (id) => {
    return request(`/services/${id}`);
  },

  getStats: async (serviceId) => {
    return request(`/services/${serviceId}/stats`);
  },

  // ADMIN
  getMesServices: async () => {
    return request('/services/me/services');
  },

  create: async (serviceData) => {
    return request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  update: async (id, data) => {
    return request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return request(`/services/${id}`, { method: 'DELETE' });
  },

  toggleActif: async (id) => {
    return request(`/services/${id}/toggle`, { method: 'PATCH' });
  },
};

// ============================================
// API TICKETS
// ============================================
export const ticketsAPI = {
  // CITOYEN
  create: async (ticketData) => {
    return request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },

  getMesTickets: async () => {
    return request('/tickets/mes-tickets');
  },

  getById: async (id) => {
    return request(`/tickets/${id}`);
  },

  cancel: async (id) => {
    return request(`/tickets/${id}`, { method: 'DELETE' });
  },

  // AGENT - routes corrigées pour matcher le backend
  getFileAttente: async () => {
    return request('/tickets/agent/file');
  },

  // Alias gardé pour compatibilité
  getByService: async () => {
    return request('/tickets/agent/file');
  },

  appelerSuivant: async () => {
    return request('/tickets/agent/appeler', { method: 'POST' });
  },

  marquerServi: async (id) => {
    return request(`/tickets/agent/${id}/servi`, { method: 'PUT' });
  },

  marquerAbsent: async (id) => {
    return request(`/tickets/agent/${id}/absent`, { method: 'PUT' });
  },

  mettreEnPause: async () => {
    return request('/tickets/agent/pause', { method: 'PUT' });
  },

  reprendreFile: async () => {
    return request('/tickets/agent/reprendre', { method: 'PUT' });
  },

  getStatsAgent: async () => {
    return request('/tickets/agent/stats');
  },

  // ADMIN
  getStats: async (etablissementId, dateDebut, dateFin) => {
    return request(`/tickets/stats/${etablissementId}?dateDebut=${dateDebut}&dateFin=${dateFin}`);
  },
};

// ============================================
// API RENDEZ-VOUS
// ============================================
export const rdvAPI = {
  // CITOYEN
  getCreneaux: async (serviceId, date) => {
    return request(`/rendezvous/creneaux?serviceId=${serviceId}&date=${date}`);
  },

  create: async (rdvData) => {
    return request('/rendezvous', {
      method: 'POST',
      body: JSON.stringify(rdvData),
    });
  },

  getById: async (id) => {
    return request(`/rendezvous/${id}`);
  },

  getMesRDV: async () => {
    return request('/rendezvous/mes-rdv');
  },

  cancel: async (id) => {
    return request(`/rendezvous/${id}`, { method: 'DELETE' });
  },

  reschedule: async (id, data) => {
    return request(`/rendezvous/${id}/reprogrammer`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // AGENT
  getByService: async (_serviceId, date) => {
    return request(`/rendezvous/agent/jour${date ? '?date=' + date : ''}`);
  },

  getMesRDVJour: async (date) => {
    return request(`/rendezvous/agent/jour${date ? '?date=' + date : ''}`);
  },

  getCreneauxJour: async (date) => {
    return request(`/rendezvous/agent/creneaux-jour${date ? '?date=' + date : ''}`);
  },

  reprogrammerRDVAgent: async (id, data) => {
    return request(`/rendezvous/agent/${id}/reprogrammer`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  bloquerCreneau: async (id) => {
    return request(`/creneaux/${id}/bloquer`, { method: 'PUT' });
  },

  debloquerCreneau: async (id) => {
    return request(`/creneaux/${id}/debloquer`, { method: 'PUT' });
  },

  marquerPresent: async (id) => {
    return request(`/rendezvous/agent/${id}/present`, { method: 'PUT' });
  },

  marquerComplete: async (id) => {
    return request(`/rendezvous/agent/${id}/termine`, { method: 'PUT' });
  },

  marquerAbsent: async (id) => {
    return request(`/rendezvous/agent/${id}/no-show`, { method: 'PUT' });
  },

  // ADMIN
  // Configurer le planning récurrent (nouvelle API — remplace génération manuelle)
  configurerRDV: async (serviceId, config) => {
    return request(`/rendezvous/service/${serviceId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  // Ajouter exception (1 jour ou plage, fermeture ou horaire modifié)
  // exception = { date, date_fin?, type, heure_debut_exceptionnelle?, heure_fin_exceptionnelle?, raison? }
  ajouterException: async (serviceId, exception) => {
    return request(`/rendezvous/service/${serviceId}/exception`, {
      method: 'POST',
      body: JSON.stringify(exception),
    });
  },

  // Supprimer exception
  supprimerException: async (serviceId, date) => {
    return request(`/rendezvous/service/${serviceId}/exception`, {
      method: 'DELETE',
      body: JSON.stringify({ date }),
    });
  },

  creneauxService: async (serviceId, dateDebut, dateFin) => {
    return request(`/rendezvous/service/${serviceId}/creneaux?date_debut=${dateDebut}&date_fin=${dateFin}`);
  },

  // Créer RDV manuel (agent — réservation téléphonique)
  creerRDVManuel: async (rdvData) => {
    return request('/rendezvous/agent/rdv-manuel', {
      method: 'POST',
      body: JSON.stringify(rdvData),
    });
  },

  // Anciennes méthodes conservées pour compatibilité
  configurerHoraires: async (serviceId, horaires) => {
    return request(`/rendezvous/service/${serviceId}/horaires`, {
      method: 'PUT',
      body: JSON.stringify(horaires),
    });
  },

  genererCreneaux: async (serviceId, config) => {
    return request(`/rendezvous/service/${serviceId}/generer-creneaux`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  getStats: async (etablissementId, dateDebut, dateFin) => {
    return request(`/rendezvous/stats/${etablissementId}?dateDebut=${dateDebut}&dateFin=${dateFin}`);
  },
};

// ============================================
// API AGENTS
// ============================================
export const agentsAPI = {
  // ADMIN - utilise le token pour identifier l'établissement
  getAll: async () => {
    return request('/agents');
  },

  // Alias pour compatibilité
  getByEtablissement: async () => {
    return request('/agents');
  },

  create: async (agentData) => {
    return request('/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  },

  update: async (id, data) => {
    return request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return request(`/agents/${id}`, { method: 'DELETE' });
  },

  assignerService: async (agentId, serviceId) => {
    return request(`/agents/${agentId}/assigner-service`, {
      method: 'PUT',
      body: JSON.stringify({ service_id: serviceId }),
    });
  },
};

// ============================================
// API NOTIFICATIONS
// ============================================
export const notificationsAPI = {
  getMine: async () => {
    return request('/notifications');
  },

  markAsRead: async (id) => {
    return request(`/notifications/${id}/lire`, { method: 'PUT' });
  },

  markAllAsRead: async () => {
    return request('/notifications/tout-lire', { method: 'PUT' });
  },

  delete: async (id) => {
    return request(`/notifications/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// API STATISTIQUES
// ============================================
export const statsAPI = {
  getDashboardEtablissement: async (etablissementId) => {
    return request(`/stats/etablissement/${etablissementId}/dashboard`);
  },

  getDashboardPlateforme: async () => {
    return request('/stats/plateforme/dashboard');
  },

  getDetailed: async (etablissementId, dateDebut, dateFin) => {
    return request(`/stats/etablissement/${etablissementId}?dateDebut=${dateDebut}&dateFin=${dateFin}`);
  },
};

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
