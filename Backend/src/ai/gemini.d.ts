export declare function getPlantCareTips(plantName: string, problem: string): Promise<string>;
export declare function generateNotificationContent(type: 'reminder' | 'alert' | 'tip', context: Record<string, any>): Promise<string>;
export declare function analyzePlantHealth(plantName: string, symptoms: string, environment: Record<string, any>): Promise<{
    diagnosis: string;
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
}>;
//# sourceMappingURL=gemini.d.ts.map