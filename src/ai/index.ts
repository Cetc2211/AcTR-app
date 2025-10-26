'use server';

import { generateStudentFeedback } from "./flows/generate-student-feedback-flow";
import { generateGroupReportAnalysis } from "./flows/generate-group-report-analysis-flow";

export {
    generateStudentFeedback,
    generateGroupReportAnalysis,
};
