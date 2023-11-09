"use client"; // This is a client component
import 'mapbox-gl/dist/mapbox-gl.css';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Import the MapComponent only on the client side
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

export default function Home() {



  return (
    <main className="flex min-h-screen flex-col items-center">
     <MapComponent  />
    </main>
  )
}
