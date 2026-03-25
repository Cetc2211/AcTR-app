import React from 'react';

interface RiskIndicatorProps {
    irc: number; // Índice de Riesgo Compuesto (0-100)
    nivel: string; // Nivel de Riesgo (ej. 'Alto (Rojo)')
    color: 'green' | 'yellow' | 'red'; // Color del Semáforo
}

const colorMap = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
};

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ irc, nivel, color }) => {
    return (
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 border">
            {/* Círculo del Semáforo */}
            <div
                className={`w-4 h-4 rounded-full shadow-md ${colorMap[color]}`}
                title={`IRC: ${irc}%`}
            />

            {/* Texto del Nivel de Riesgo */}
            <div className="flex flex-col text-sm">
                <span className={`font-semibold ${color === 'red' ? 'text-red-600' : 'text-gray-800'}`}>
                    {nivel}
                </span>
                <span className="text-xs text-gray-500">
                    IRC: {irc}%
                </span>
            </div>
        </div>
    );
};

export default RiskIndicator;
