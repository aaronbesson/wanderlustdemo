// pages/api/getPlaces.js

export default async function handler(req, res) {
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${req.body.location}&radius=10000&type=${req.body.locationValue}&keyword=${req.body.locationValue}&key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      // Check if the request was successful
      if (response.ok) {
        const data = await response.json();
        res.status(200).json(data.results);
      } else {
        // Handle errors, such as invalid API key or quota exceeded
        console.error('Error from Google Places API:', response.statusText);
        res.status(response.status).json({ message: 'Failed to fetch place details' });
      }
    } catch (error) {
      // Handle network or unexpected runtime errors
      console.error('Error fetching place details:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  