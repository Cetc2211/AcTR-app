export const enviarResultadoAAcademicTracker = async (data: {
  alumnoId: string;
  grupoId: string;
  resultado: number;
  pruebaNombre: string;
}) => {
  try {
    // Reemplaza con la URL real de tu Academic Tracker en Vercel
    const AC_TRACKER_URL = 'https://academic-tracker-qeoxi.vercel.app/api/vincular';

    const response = await fetch(AC_TRACKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error en la vinculación externa');
    }

    return await response.json();
  } catch (error) {
    console.error("Fallo al sincronizar con CBTa 130:", error);
    return null;
  }
};
