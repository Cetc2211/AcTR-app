
'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { WiscCalculationResult } from '@/lib/wisc-logic';

// Registrar fuentes (opcional, usando estándar por ahora)
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5
  },
  section: {
    margin: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontSize: 10,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 10,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
    marginBottom: 10
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableCol: {
    width: "16%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCell: {
    margin: 5,
    fontSize: 8
  },
  tableHeader: {
    backgroundColor: '#E5E7EB',
    fontWeight: 'bold'
  },
  text: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.5,
    textAlign: 'justify'
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  diagnosisBox: {
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: 10,
    marginTop: 10,
    borderRadius: 4
  },
  diagnosisTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B91C1C',
    marginBottom: 4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10
  }
});

// Componente interno para dibujar el gráfico de barras en PDF
const IndicesProfileChart = ({ indices }: { indices: any[] }) => {
    return (
        <View style={{ 
            height: 140, 
            flexDirection: 'row', 
            alignItems: 'flex-end', 
            justifyContent: 'center', 
            paddingBottom: 10, 
            paddingTop: 10,
            backgroundColor: '#FAFAFA',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#F3F4F6'
        }}>
            {indices.filter(i => i.id !== 'CIT').map((idx) => (
                <View key={idx.id} style={{ flexDirection: 'column', alignItems: 'center', width: 60 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#374151' }}>{idx.pc}</Text>
                    <View style={{ 
                        height: Math.max(2, (idx.pc / 160) * 100), 
                        width: 25, 
                        backgroundColor: idx.pc < 80 ? '#F87171' : idx.pc < 90 ? '#FBBF24' : '#34D399',
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3
                    }} />
                    <View style={{ height: 1, width: '100%', backgroundColor: '#D1D5DB', marginTop: 1 }} />
                    <Text style={{ fontSize: 8, marginTop: 4, textAlign: 'center', fontWeight: 'bold', color: '#4B5563' }}>{idx.id}</Text>
                    <Text style={{ fontSize: 6, textAlign: 'center', color: '#9CA3AF', width: 50 }}>{idx.name}</Text>
                </View>
            ))}
        </View>
    );
};

interface WiscReportDocumentProps {
    data: WiscCalculationResult;
    studentInfo: {
        name: string;
        age: string;
        date: string;
    };
    chartImage?: string; // Imagen del gráfico generada en cliente
}

export const WiscReportDocument = ({ data, studentInfo, chartImage }: WiscReportDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* I. Datos de Identificación */}
      <View style={styles.header}>
        <Text style={styles.title}>Informe Psicológico WISC-V</Text>
        <Text style={styles.subtitle}>Suite PIGEC-130 - Sistema Experto de Evaluación</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>I. Datos de Identificación</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre del Evaluado:</Text>
          <Text style={styles.value}>{studentInfo.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Edad Cronológica:</Text>
          <Text style={styles.value}>{studentInfo.age}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha de Evaluación:</Text>
          <Text style={styles.value}>{studentInfo.date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Institución:</Text>
          <Text style={styles.value}>CBTa 130</Text>
        </View>
      </View>

      {/* II. Perfil Gráfico (Generado nativamente en PDF) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>II. Perfil Gráfico de Puntuaciones</Text>
        <IndicesProfileChart indices={data.indices} />
      </View>

      {/* III. Resumen de Índices (Tabla) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>III. Resumen de Índices</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Índice</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Suma PE</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Puntaje Compuesto</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Percentil</Text></View>
            <View style={[styles.tableCol, { width: "36%" }]}><Text style={styles.tableCell}>Clasificación</Text></View>
          </View>
          
          {data.indices.map((idx) => (
            <View style={styles.tableRow} key={idx.id}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{idx.name}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{idx.sumPE}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{idx.pc}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{idx.percentile}</Text></View>
              <View style={[styles.tableCol, { width: "36%" }]}><Text style={styles.tableCell}>{idx.classification}</Text></View>
            </View>
          ))}
        </View>
      </View>

      {/* IV. Interpretación Narrativa */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>IV. Interpretación de Resultados</Text>
        
        {/* Introducción CIT */}
        <Text style={styles.text}>
            El Coeficiente Intelectual Total (CIT) obtenido es de {data.indices.find(i => i.id === 'CIT')?.pc}, 
            lo que ubica su funcionamiento intelectual general en el rango {data.indices.find(i => i.id === 'CIT')?.classification}.
        </Text>

        {/* Párrafos del Diccionario */}
        {Object.entries(data.narrative).map(([key, text]) => (
            <View key={key} style={{ marginBottom: 5 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>
                    {data.indices.find(i => i.id === key)?.name}:
                </Text>
                <Text style={styles.text}>{text}</Text>
            </View>
        ))}
      </View>

      {/* V. Síntesis y Recomendaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>V. Síntesis Diagnóstica y Recomendaciones</Text>
        
        <View style={styles.diagnosisBox}>
            <Text style={styles.diagnosisTitle}>Síntesis Diagnóstica:</Text>
            <Text style={styles.text}>{data.analysis.diagnosis}</Text>
        </View>

        {data.analysis.discrepancies.length > 0 && (
            <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#D97706' }}>Alertas Clínicas:</Text>
                {data.analysis.discrepancies.map((d, i) => (
                    <Text key={i} style={styles.text}>• {d}</Text>
                ))}
            </View>
        )}

        <Text style={[styles.text, { marginTop: 10 }]}>
            Recomendaciones:
            {"\n"}• Ubicar al estudiante en un lugar estratégico del aula para realizar seguimiento y apoyos.
            {"\n"}• Implementar pausas activas durante evaluaciones largas.
            {"\n"}• Fomentar el uso de organizadores gráficos.
        </Text>
      </View>

      {/* Firma */}
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <View style={{ borderBottomWidth: 1, width: 200, marginBottom: 5 }} />
        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Lic. Psicología Educativa</Text>
        <Text style={{ fontSize: 8, color: '#6B7280' }}>Matrícula Profesional: 000-000</Text>
      </View>

      <Text style={styles.footer}>
        Generado automáticamente por Suite PIGEC-130 | {new Date().toLocaleDateString()}
      </Text>
    </Page>
  </Document>
);
