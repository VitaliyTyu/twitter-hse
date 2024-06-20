
import React from 'react';
import Link from 'next/link';

const NavigationPanel: React.FC = () => {
    return (
        <div className="bg-gray-600 text-white py-4">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div className="flex">
                    <Link href="/" className="mr-4">Home</Link>
                </div>
            </div>
        </div>
    );
};

export default NavigationPanel;
