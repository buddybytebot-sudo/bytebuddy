
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const FoodAnalysisPage: React.FC = () => {
    const [mealDescription, setMealDescription] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealDescription.trim()) {
            setError('Please describe your meal.');
            return;
        }
        setError('');
        setAnalysis('');
        setLoading(true);
        try {
            const response = await geminiService.analyzeMeal(mealDescription);
            setAnalysis(response.text);
        } catch (err) {
            setError('Failed to analyze meal. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-sora text-text-primary mb-2">Food Intake Analysis</h1>
            <p className="text-text-secondary mb-6">Describe a meal you've eaten, and ByteBuddy will provide nutritional insights.</p>
            
            <div className="bg-card p-6 rounded-2xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="meal" className="block text-sm font-medium text-text-secondary mb-2">Describe your meal</label>
                        <textarea
                            id="meal"
                            name="meal"
                            rows={4}
                            value={mealDescription}
                            onChange={(e) => setMealDescription(e.target.value)}
                            className="w-full bg-background border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            placeholder="e.g., A large cheeseburger with lettuce, tomato, and a side of french fries."
                            required
                        />
                    </div>
                     <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background">
                        {loading ? 'Analyzing...' : 'Analyze Meal'}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
            </div>
            
            {loading && (
                 <div className="mt-8 bg-card p-6 rounded-2xl shadow-lg text-center">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary mx-auto mb-4"></div>
                    <p className="text-text-primary">Analyzing your meal with AI...</p>
                 </div>
            )}
            
            {analysis && (
                <div className="mt-8 bg-card p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold font-sora text-text-primary mb-4">Meal Analysis</h2>
                    <div className="prose prose-invert prose-headings:font-sora prose-headings:mt-6 prose-headings:mb-2 prose-p:text-text-secondary prose-li:text-text-secondary max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodAnalysisPage;
