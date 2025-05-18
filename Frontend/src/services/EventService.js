// src/services/EventService.js

/**
 * Servizio per interagire con le API degli eventi
 */
const EventService = {
  /**
   * Recupera gli eventi pubblici dal server
   * @returns {Promise<Array>} Array di eventi
   */
  getPublicEvents: async () => {
    try {
      const response = await fetch('/api/v1/public/events');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli eventi');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Errore nel recupero eventi:', err);
      throw err;
    }
  }
};

export default EventService;