import { NextApiRequest, NextApiResponse } from 'next'

export default async function createMessage(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  const url = 'https://api.openai.com/v1/chat/completions'

  const body = JSON.stringify({
    model: "gpt-4-1106-preview",
    messages: [
      { role: "system", content: "You are a sophisticated AI travel assistant as well as a specialist in user intent detection and interpretation. Your task is to perceive and respond to the user's needs as they travel. Do not share the user's latitude and longitude coordinates in the chat, but rather use the coordinates to determine the City, State or Country they are in and share that data with them." },
      { "role": "user", "content": req.body }
    ],
    max_tokens: 1500,
    tools: [
      {
        "type": "function",
        "function": {
          "name": "two_functions",
          "description": "Run two functions at the same time",
          "parameters": {
            "type": "object",
            "properties": {
              "map_annotations": {
                "name": "map_annotations",
                "description": "List locations on the map based on the category of interest",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "category": {
                      "type": "string",
                      "enum": [
                        "hotel",
                        "restaurant",
                        "airport",
                        "taxi",
                        "point_of_interest",
                        "shopping",
                        "schools",
                        "police",
                        "hospital",
                        "beach",
                        "park",
                        "entertainment",
                        "nightlife",
                        "ocean",
                        "sea",
                        "lake",
                        "river",
                        "mountain",
                        "forest",
                        "desert",
                        "island",
                        "other"
                      ],
                      "description": "Category of the location to be annotated on the map"
                    }
                  },
                  "required": ["category"]
                }
              },
              "set_location": {
                "name": "set_location",
                "description": "Set the location of the user on the map",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "location": {
                      "type": "string",
                      "description": "City, State or Country of the user's location e.g. San Francisco, CA, USA"
                    }
                  },
                  "required": ["location"]
                }
              }
            },
            "required": ["map_annotations", "set_location"]
          }
        }
      }


    ],
    tool_choice: "auto",
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    })
    const data = await response.json()
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error })
  }
}