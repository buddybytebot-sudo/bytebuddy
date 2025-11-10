import React, { useState } from 'react';
import { useLogger } from '../context/LoggerContext';
import { MealLog } from '../types';
import { TrashIcon } from '../components/ui/Icons';
import WeeklyCalorieChart from '../components/WeeklyCalorieChart';

const ProgressCircle: React.FC<{ progress: number, size: number, strokeWidth: number, label: string, unit: string, value: number, goal: number }> = ({ progress, size, strokeWidth, label, unit, value, goal }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} className="stroke-gray-700" fill="transparent" />
                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} className="stroke-primary" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold text-text-primary">{value.toLocaleString()}</span>
                <span className="text-sm text-text-secondary">of {goal.toLocaleString()} {unit}</span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
            </div>
        </div>
    );
};


const LoggerPage: React.FC = () => {
    const { 
        todaysWaterLogs, 
        todaysMealLogs, 
        waterGoal, 
        calorieGoal, 
        todaysWater, 
        todaysCalories, 
        addWaterLog, 
        addMealLog, 
        deleteWaterLog,
        weeklyCalorieData,
    } = useLogger();
    
    const [waterAmount, setWaterAmount] = useState('');
    const [mealForm, setMealForm] = useState({ description: '', amount: '', mealType: 'Breakfast' as MealLog['mealType'] });
    const [isMealLogging, setIsMealLogging] = useState(false);

    const handleAddWater = (amount?: number) => {
        const value = amount || parseInt(waterAmount, 10);
        if (value > 0) {
            addWaterLog(value);
            setWaterAmount('');
        }
    };
    
    const handleAddMeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mealForm.description && mealForm.amount && !isMealLogging) {
            setIsMealLogging(true);
            try {
                await addMealLog({ description: mealForm.description, amount: mealForm.amount, mealType: mealForm.mealType });
                setMealForm({ description: '', amount: '', mealType: 'Breakfast' });
            } catch (error) {
                console.error("Failed to log meal:", error);
            } finally {
                setIsMealLogging(false);
            }
        }
    };
    
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-sora text-text-primary mb-2">Health Logger</h1>
                <p className="text-text-secondary mb-6">Keep track of your daily water and food intake to stay on top of your goals.</p>
            </div>

            {/* Stats */}
            <div className="bg-card p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-around gap-8">
                <ProgressCircle progress={(todaysWater / waterGoal) * 100} size={160} strokeWidth={12} label="Water" unit="ml" value={todaysWater} goal={waterGoal} />
                <ProgressCircle progress={(todaysCalories / calorieGoal) * 100} size={160} strokeWidth={12} label="Calories" unit="kcal" value={todaysCalories} goal={calorieGoal} />
                <div className="text-center md:text-left">
                    <h3 className="font-sora text-xl font-bold">Today's Summary</h3>
                    <p className="text-text-secondary mt-2">You're doing great! Consistency is key.</p>
                    <p className="text-sm text-primary mt-1">{waterGoal - todaysWater > 0 ? `${waterGoal - todaysWater}ml of water left.` : "Water goal reached!"}</p>
                    <p className="text-sm text-primary mt-1">{calorieGoal - todaysCalories > 0 ? `${calorieGoal - todaysCalories} calories remaining.` : "Calorie goal reached!"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Water Logger */}
                <div className="bg-card p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold font-sora mb-4">Log Water Intake</h2>
                    <div className="flex items-center gap-2 mb-4">
                        <input type="number" value={waterAmount} onChange={e => setWaterAmount(e.target.value)} placeholder="Amount in ml" className="flex-grow bg-background border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                        <button onClick={() => handleAddWater()} className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90">Log</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleAddWater(250)} className="flex-1 py-2 bg-primary/20 text-primary rounded-md hover:bg-primary/30 text-sm">1 Cup (250ml)</button>
                        <button onClick={() => handleAddWater(500)} className="flex-1 py-2 bg-primary/20 text-primary rounded-md hover:bg-primary/30 text-sm">500ml</button>
                        <button onClick={() => handleAddWater(750)} className="flex-1 py-2 bg-primary/20 text-primary rounded-md hover:bg-primary/30 text-sm">750ml</button>
                    </div>
                     <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                        {todaysWaterLogs.map(log => (
                            <li key={log.id} className="flex justify-between items-center bg-background/50 p-2 rounded-md">
                                <span>{log.amount} ml</span>
                                <span className="text-xs text-text-secondary">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <button onClick={() => deleteWaterLog(log.id)} className="text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Meal Logger */}
                <div className="bg-card p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold font-sora mb-4">Log a Meal</h2>
                    <form onSubmit={handleAddMeal} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <input type="text" value={mealForm.amount} onChange={e => setMealForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (e.g., 1 bowl)" required className="sm:col-span-1 w-full bg-background border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                            <input type="text" value={mealForm.description} onChange={e => setMealForm(f => ({ ...f, description: e.target.value }))} placeholder="Meal Description" required className="sm:col-span-2 w-full bg-background border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <select value={mealForm.mealType} onChange={e => setMealForm(f => ({ ...f, mealType: e.target.value as MealLog['mealType'] }))} className="w-full bg-background border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                            <option>Breakfast</option>
                            <option>Lunch</option>
                            <option>Dinner</option>
                            <option>Snack</option>
                        </select>
                        <button type="submit" disabled={isMealLogging || !mealForm.description || !mealForm.amount} className="w-full py-2 bg-secondary text-white rounded-md hover:opacity-90 disabled:opacity-50">
                            {isMealLogging ? 'Estimating...' : 'Log Meal'}
                        </button>
                    </form>
                    <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                        {todaysMealLogs.map(log => (
                            <li key={log.id} className="flex justify-between items-center bg-background/50 p-2 rounded-md">
                                <div>
                                    <p className="font-semibold">{log.amount} {log.description}</p>
                                    <p className="text-xs text-text-secondary">{log.mealType} - ~{log.calories} kcal</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
             <div className="bg-card p-6 rounded-2xl shadow-lg">
                 <h2 className="text-xl font-bold font-sora mb-4 text-center">Weekly Calorie Intake</h2>
                 <WeeklyCalorieChart data={weeklyCalorieData} goal={calorieGoal} />
            </div>
        </div>
    );
};

export default LoggerPage;
