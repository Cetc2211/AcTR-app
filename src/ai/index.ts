'use server';

import {
    generateStudentFeedback as executeStudentFeedbackFlow,
    type StudentFeedbackInput,
} from './flows/generate-student-feedback-flow';
import {
    generateGroupReportAnalysis as executeGroupReportAnalysisFlow,
    type GroupReportInput,
} from './flows/generate-group-report-analysis-flow';

export async function generateStudentFeedback(input: StudentFeedbackInput) {
    return executeStudentFeedbackFlow(input);
}

export async function generateGroupReportAnalysis(input: GroupReportInput) {
    return executeGroupReportAnalysisFlow(input);
}
