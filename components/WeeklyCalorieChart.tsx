import React from 'react';

interface ChartData {
    date: string;
    totalCalories: number;
}

interface WeeklyCalorieChartProps {
    data: ChartData[];
    goal: number;
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeeklyCalorieChart: React.FC<WeeklyCalorieChartProps> = ({ data, goal }) => {
    const maxCalories = Math.max(...data.map(d => d.totalCalories), goal);
    
    const getDayLabel = (dateString: string) => {
        const date = new Date(dateString);
        // Adjust for timezone offset to prevent day shifting
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return dayLabels[new Date(date.getTime() + userTimezoneOffset).getDay()];
    };

    return (
        <div className="w-full h-64 bg-background/50 p-4 rounded-lg flex flex-col">
            <div className="flex-grow flex items-end justify-around gap-2 relative">
                {/* Goal Line */}
                <div className="absolute left-0 right-0 border-t border-dashed border-secondary/50" style={{ bottom: `${(goal / maxCalories) * 100}%` }}>
                     <span className="absolute -right-2 -translate-y-1/2 text-xs text-secondary/80 bg-background/80 px-1 rounded">{goal} kcal</span>
                </div>

                {data.map(({ date, totalCalories }) => {
                    const barHeight = maxCalories > 0 ? (totalCalories / maxCalories) * 100 : 0;
                    const isOverGoal = totalCalories > goal;

                    return (
                        <div key={date} className="flex-1 flex flex-col items-center justify-end h-full group">
                            <div 
                                className={`w-3/4 rounded-t-md transition-all duration-300 ${isOverGoal ? 'bg-red-500' : 'bg-primary'}`} 
                                style={{ height: `${barHeight}%` }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card px-2 py-1 rounded-md text-xs shadow-lg">
                                    {totalCalories}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-around mt-2 text-xs text-text-secondary">
                {data.map(({ date }) => (
                    <div key={date} className="flex-1 text-center">{getDayLabel(date)}</div>
                ))}
            </div>
        </div>
    );
};

export default WeeklyCalorieChart;
