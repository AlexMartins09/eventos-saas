import React from 'react';
import ParticipantesClient from './ParticipantesClient';

export default async function Page({ params }: { params: Promise<{ id: string }> | any }) {
  let id = '';
  if (params && typeof params.then === 'function') {
    const resolvedParams = await params;
    id = resolvedParams.id;
  } else if (params && params.id) {
    id = params.id;
  }
  return <ParticipantesClient id={id} />;
}
