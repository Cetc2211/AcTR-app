import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function TutorDashboard() {
  // Aquí el sistema filtrará por el ID del docente que tiene el rol de Tutor
  // y mostrará las alertas críticas de inasistencia y desempeño.

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-blue-900">Panel de Acompañamiento Tutorial</h1>
        <p className="text-gray-600">Monitoreo de riesgo en tiempo real - CBTa 130</p>
      </header>

      {/* Sección de Alertas Críticas (IA) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-100 p-4 rounded-lg border-l-4 border-red-500">
          <h3 className="font-bold text-red-800">Inasistencia Crítica</h3>
          <p className="text-sm">3 alumnos han superado el límite de faltas esta semana.</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
          <h3 className="font-bold text-orange-800">Riesgo Académico</h3>
          <p className="text-sm">5 alumnos con promedio proyectado menor a 6.0.</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-bold text-blue-800">Intervenciones PIGEC</h3>
          <p className="text-sm">Hay 2 nuevas recomendaciones clínicas para tu grupo.</p>
        </div>
      </section>

      {/* Lista de Seguimiento del Grupo */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Estudiante</th>
              <th className="p-4">Asistencia</th>
              <th className="p-4">Cumplimiento</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* El agente de IA mapeará aquí los datos de Academic Tracker */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
