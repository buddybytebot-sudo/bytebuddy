import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DietaryPlanPage: React.FC = () => {
    const { userProfile, updateUserProfile } = useAuth();
    
    const [formData, setFormData] = useState<UserProfile>({
        age: '',
        gender: 'Male',
        height: '',
        weight: '',
        units: 'Metric',
        activityLevel: 'Sedentary',
        goal: 'Lose Weight',
        restrictions: '',
        typicalFoods: '',
        eatingHabits: '',
    });

    useEffect(() => {
        if (userProfile) {
            setFormData(userProfile);
        }
    }, [userProfile]);

    const [bmiResult, setBmiResult] = useState<{ value: number; category: string; advice: string } | null>(null);
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
             ...prev, 
             [name]: name === 'units' ? (value as 'Metric' | 'Imperial') : value 
        }));
    };
    
    const calculateBMI = () => {
        const h = parseFloat(formData.height);
        const w = parseFloat(formData.weight);
        if (!h || !w || h <= 0 || w <= 0) return null;
        
        let bmi;
        if (formData.units === 'Metric') {
            bmi = w / ((h / 100) ** 2);
        } else {
            bmi = (w / (h ** 2)) * 703;
        }
        
        let category, advice;
        if (bmi < 18.5) {
            category = 'Underweight';
            advice = 'Consider speaking with a healthcare provider to ensure you are meeting your nutritional needs.';
        } else if (bmi < 24.9) {
            category = 'Healthy Weight';
            advice = 'You are in a healthy weight range. Keep up the great work with a balanced diet and regular exercise!';
        } else if (bmi < 29.9) {
            category = 'Overweight';
            advice = 'A balanced diet and increased physical activity can help you reach a healthier weight range.';
        } else {
            category = 'Obese';
            advice = 'It may be beneficial to consult with a doctor or dietitian to create a sustainable health plan.';
        }
        return { value: parseFloat(bmi.toFixed(1)), category, advice };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setPlan('');
        
        const bmi = calculateBMI();
        if (!bmi) {
            setError('Please enter valid height and weight.');
            return;
        }
        setBmiResult(bmi);
        
        setLoading(true);
        
        // Save the updated profile info
        await updateUserProfile(formData);

        const prompt = `
            User Profile:
            - Age: ${formData.age}
            - Gender: ${formData.gender}
            - Height: ${formData.height} ${formData.units === 'Metric' ? 'cm' : 'in'}
            - Weight: ${formData.weight} ${formData.units === 'Metric' ? 'kg' : 'lbs'}
            - Daily Activity Level: ${formData.activityLevel}
            - Primary Goal: ${formData.goal}
            - Dietary Restrictions/Allergies: ${formData.restrictions || 'None'}
            - Typical Foods Eaten: ${formData.typicalFoods || 'Not specified'}
            - Current Eating Habits: ${formData.eatingHabits || 'Not specified'}
        `;

        try {
            const response = await geminiService.generateDietaryPlan(prompt);
            setPlan(response.text);
        } catch (err) {
            setError('Failed to generate plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-sora text-text-primary mb-2">Your Health Profile & Dietary Plan</h1>
            <p className="text-text-secondary mb-6">Keep your details up-to-date for personalized advice. Submit the form to generate a new 7-day meal plan.</p>
            
            <div className="bg-card p-6 rounded-2xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Form fields */}
                         <div>
                            <label className="block text-sm font-medium text-text-secondary">Age</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Units</label>
                            <select name="units" value={formData.units} onChange={handleChange} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                                <option value="Metric">Metric (cm/kg)</option>
                                <option value="Imperial">Imperial (in/lbs)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-text-secondary">Height ({formData.units === 'Metric' ? 'cm' : 'in'})</label>
                                <input type="number" name="height" value={formData.height} onChange={handleChange} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Weight ({formData.units === 'Metric' ? 'kg' : 'lbs'})</label>
                                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Daily Activity Level</label>
                            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                                <option>Sedentary (little or no exercise)</option>
                                <option>Lightly Active (light exercise/sports 1-3 days/week)</option>
                                <option>Moderately Active (moderate exercise/sports 3-5 days/week)</option>
                                <option>Very Active (hard exercise/sports 6-7 days a week)</option>
                                <option>Extra Active (very hard exercise/physical job)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Primary Goal</label>
                            <select name="goal" value={formData.goal} onChange={handleChange} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                                <option>Lose Weight</option>
                                <option>Maintain Weight</option>
                                <option>Gain Muscle</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-text-secondary">Dietary Restrictions/Allergies</label>
                            <textarea name="restrictions" value={formData.restrictions} onChange={handleChange} rows={2} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., Lactose intolerant, gluten-free, vegetarian"></textarea>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-text-secondary">Typical Foods Eaten</label>
                            <textarea name="typicalFoods" value={formData.typicalFoods} onChange={handleChange} rows={2} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., Chicken breast, brown rice, pasta, salads"></textarea>
                        </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-text-secondary">Current Eating Habits</label>
                            <textarea name="eatingHabits" value={formData.eatingHabits} onChange={handleChange} rows={2} className="mt-1 block w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., I skip breakfast, I eat 3 meals a day, I snack late at night"></textarea>
                        </div>
                    </div>
                     <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background">
                        {loading ? 'Generating Plan...' : 'Save & Generate My Plan'}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
            </div>
            
            {bmiResult && (
                <div className="mt-8 bg-card p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold font-sora text-text-primary">Your BMI Result</h2>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">{bmiResult.value}</p>
                    <p className="font-semibold text-text-primary">{bmiResult.category}</p>
                    <p className="text-text-secondary mt-1">{bmiResult.advice}</p>
                </div>
            )}

            {loading && (
                 <div className="mt-8 bg-card p-6 rounded-2xl shadow-lg text-center">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary mx-auto mb-4"></div>
                    <p className="text-text-primary">Generating your personalized plan...</p>
                 </div>
            )}
            
            {plan && (
                <div className="mt-8 bg-card p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold font-sora text-text-primary mb-4">Your 7-Day Dietary Plan</h2>
                    <div className="prose prose-invert prose-headings:font-sora prose-headings:mt-6 prose-headings:mb-2 prose-p:text-text-secondary prose-li:text-text-secondary max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietaryPlanPage;
