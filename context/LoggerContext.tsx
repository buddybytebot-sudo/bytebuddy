import React, { createContext, useState, useEffect, ReactNode, useContext, useMemo } from 'react';
import { WaterLog, MealLog } from '../types';
import { useAuth } from './AuthContext';
import { geminiService } from '../services/geminiService';

interface WeeklyCalorieData {
    date: string;
    totalCalories: number;
}

interface LoggerContextType {
  todaysWaterLogs: WaterLog[];
  todaysMealLogs: MealLog[];
  weeklyCalorieData: WeeklyCalorieData[];
  waterGoal: number; // in ml
  calorieGoal: number; // in kcal
  todaysWater: number;
  todaysCalories: number;
  addWaterLog: (amount: number) => Promise<void>;
  addMealLog: (meal: Omit<MealLog, 'id' | 'createdAt' | 'calories'>) => Promise<void>;
  deleteWaterLog: (id: string) => Promise<void>;
}

export const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

export const LoggerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
    const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
    const [loading, setLoading] = useState(true);
    
    const waterGoal = 2500;
    const calorieGoal = 2000;

    useEffect(() => {
        if (user) {
            setLoading(true);
            try {
                const storedWater = localStorage.getItem(`bytebuddy_water_${user.id}`);
                const storedMeals = localStorage.getItem(`bytebuddy_meals_${user.id}`);
                if (storedWater) setWaterLogs(JSON.parse(storedWater));
                if (storedMeals) setMealLogs(JSON.parse(storedMeals));
            } catch (error) {
                console.error("Error loading logger data from localStorage", error);
            } finally {
                setLoading(false);
            }
        } else {
            setWaterLogs([]);
            setMealLogs([]);
        }
    }, [user]);

    useEffect(() => {
        if (user && !loading) {
            localStorage.setItem(`bytebuddy_water_${user.id}`, JSON.stringify(waterLogs));
            localStorage.setItem(`bytebuddy_meals_${user.id}`, JSON.stringify(mealLogs));
        }
    }, [waterLogs, mealLogs, user, loading]);

    const addWaterLog = async (amount: number) => {
        if (!user || amount <= 0) return;
        const newLog: WaterLog = {
            id: `water-${Date.now()}`,
            amount,
            createdAt: new Date().toISOString(),
        };
        setWaterLogs(prev => [...prev, newLog]);
    };

    const addMealLog = async (meal: Omit<MealLog, 'id' | 'createdAt' | 'calories'>) => {
        if (!user || !meal.description) return;

        const estimatedCalories = await geminiService.estimateCalories(meal.description, meal.amount);

        const newLog: MealLog = {
            ...meal,
            id: `meal-${Date.now()}`,
            calories: estimatedCalories,
            createdAt: new Date().toISOString(),
        };
        setMealLogs(prev => [...prev, newLog]);
    };

    const deleteWaterLog = async (id: string) => {
        setWaterLogs(prev => prev.filter(log => log.id !== id));
    };
    
    const todaysData = useMemo(() => {
        const today = new Date();
        const todaysWaterLogs = waterLogs.filter(log => isSameDay(new Date(log.createdAt), today));
        const todaysMealLogs = mealLogs.filter(log => isSameDay(new Date(log.createdAt), today));
        const todaysWater = todaysWaterLogs.reduce((acc, log) => acc + log.amount, 0);
        const todaysCalories = todaysMealLogs.reduce((acc, log) => acc + log.calories, 0);

        return {
            todaysWaterLogs: todaysWaterLogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            todaysMealLogs: todaysMealLogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            todaysWater,
            todaysCalories
        }
    }, [waterLogs, mealLogs]);

    const weeklyCalorieData = useMemo(() => {
        const data: WeeklyCalorieData[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const logsForDay = mealLogs.filter(log => isSameDay(new Date(log.createdAt), date));
            const totalCalories = logsForDay.reduce((sum, log) => sum + log.calories, 0);

            data.push({
                date: date.toISOString().split('T')[0],
                totalCalories,
            });
        }
        return data;
    }, [mealLogs]);


    const value = {
        todaysWaterLogs: todaysData.todaysWaterLogs,
        todaysMealLogs: todaysData.todaysMealLogs,
        weeklyCalorieData,
        waterGoal,
        calorieGoal,
        todaysWater: todaysData.todaysWater,
        todaysCalories: todaysData.todaysCalories,
        addWaterLog,
        addMealLog,
        deleteWaterLog,
    };

    return <LoggerContext.Provider value={value}>{children}</LoggerContext.Provider>;
};

export const useLogger = () => {
    const context = useContext(LoggerContext);
    if (context === undefined) {
        throw new Error('useLogger must be used within a LoggerProvider');
    }
    return context;
};
