
'use client';

import React from 'react';
import { Suspense } from 'react';
import { FriendsPageContent } from '@/components/friends/page';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function FriendsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner className="