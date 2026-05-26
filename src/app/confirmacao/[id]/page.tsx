import React from 'react';
import ConfirmationPageClient from './ConfirmationPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  return <ConfirmationPageClient id={id} />;
}
