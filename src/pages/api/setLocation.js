// pages/api/getLatLng.js

import axios from 'axios';

export default async function handler(req, res) {
    const input = req.query.input;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.body}&key=${apiKey}`;
        const geocodeResponse = await axios.get(url);

        if (geocodeResponse.data.status !== 'OK') {
            throw new Error(geocodeResponse.data.error_message || 'Geocoding failed');
        }

        const results = geocodeResponse.data.results;
        if (results.length === 0) {
            throw new Error('No results found');
        }

        const lat = results[0].geometry.location.lat;
        const lng = results[0].geometry.location.lng;

        res.status(200).json([lat, lng]); // Send the coordinates as an array

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
