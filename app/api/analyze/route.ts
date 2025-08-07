// import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};



export async function POST(request: Request) {
  try {
    // Parse the uploaded file using formData()
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    // Read file contents as text
    const text = await file.text();

    // Send text to ClinicalBERT (Hugging Face Inference API)
    const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;
    const MODEL_ID = "emilyalsentzer/Bio_ClinicalBERT";
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

    const hfRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!hfRes.ok) {
      const error = await hfRes.text();
      return new Response(JSON.stringify({ error }), { status: hfRes.status });
    }

    const result = await hfRes.json();
    // Return both original text and model result
    return new Response(JSON.stringify({ text, result }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
