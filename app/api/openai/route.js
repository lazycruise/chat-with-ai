// Import the necessary classes from the OpenAI package
import { NextResponse } from "next/server";
// import { Configuration, OpenAIApi } from "openai";
import OpenAI from "openai";

// Create a new OpenAI object
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the default export as an asynchronous function handling an HTTP request and response
export async function POST(request) {
  const value = await request.json();
  const input = await value.prompt;

  console.log(value, input);

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: input }],
      model: "gpt-3.5-turbo",
    });

    // Get the first choice's text from the completion response
    const openaiResponse = chatCompletion.choices[0].message.content;

    return NextResponse.json({ result: openaiResponse });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      return NextResponse.json({ error: error.response.data }, { status: 500 });
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return NextResponse.json(
        { error: "An error occurred during your request." },
        { status: 500 }
      );
    }
  }
}
