'use client';

import WISCScoringConsole from "@/components/WISC-VScoringConsole";
import { getStudentById } from "@/lib/store";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";

export default function ConsolePage() {
    const params = useParams();
    const studentId = params.studentId as string;
    
    const student = getStudentById(studentId);

    if (!student) {
        return (
            <div className="flex h-screen w-full items-center justify-center p-8">
                <div className="flex items-center gap-2 text-xl text-gray-600">
                    <Loader className="animate-spin" />
                    Cargando datos del estudiante...
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <WISCScoringConsole studentId={student.id} studentAge={student.demographics.age} />
        </div>
    );
}
