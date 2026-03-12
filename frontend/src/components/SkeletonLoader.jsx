import React from 'react';

export const SkeletonBox = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`}></div>
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
    <div className={`space-y-3 ${className}`}>
        {Array(lines).fill(0).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 rounded animate-pulse w-${i % 2 === 0 ? 'full' : '3/4'}`}></div>
        ))}
    </div>
);

export const SkeletonDashboard = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-32 flex flex-col justify-between">
                    <SkeletonBox className="h-4 w-1/2" />
                    <SkeletonBox className="h-8 w-1/3" />
                </div>
            ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96">
            <SkeletonBox className="h-6 w-1/4 mb-8" />
            <SkeletonBox className="h-full w-full" />
        </div>
    </div>
);
