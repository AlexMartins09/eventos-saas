import React from 'react';
import EditarEventoClient from './EditarEventoClient';

export default async function Page({ params }: { params: Promise<{ id: string }> | any }) {
  let id = '';
  if (params && typeof params.then === 'function') {
    const resolvedParams = await params;
    id = resolvedParams.id;
  } else if (params && params.id) {
    id = params.id;
  }
  return <EditarEventoClient id={id} />;
}
