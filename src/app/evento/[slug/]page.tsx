import React from 'react';
import EventPageClient from './EventPageClient';

export default async function Page({ params }: { params: Promise<{ slug: string }> | any }) {
  // Apenas aguarda o parâmetro em Next.js 15/16 se for uma promise
  let slug = '';
  if (params && typeof params.then === 'function') {
    const resolvedParams = await params;
    slug = resolvedParams.slug;
  } else if (params && params.slug) {
    slug = params.slug;
  }
  
  return <EventPageClient slug={slug} />;
}
