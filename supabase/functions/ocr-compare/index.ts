import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const expectedText = formData.get("expectedText") as string || "";

    const looksLikeQuestion = (s: string) => {
      if (!s) return false;
      const trimmed = s.trim().toLowerCase();
      if (trimmed.includes("?")) return true;
      return /^(where|what|who|when|why|how|which|whom|did|do|does|is|are|was|were)\b/.test(trimmed);
    };

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert image to base64 in chunks
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64Image = btoa(binary);

    // Determine MIME type
    const mimeType = imageFile.type || "image/png";

    const baseSystem = `You are an OCR and text comparison assistant for an Early Grade Reading/Math Assessment.
Your job is to extract text from uploaded student work and report findings.`;

    const systemPrompt2 = looksLikeQuestion(expectedText)
      ? baseSystem + `\n\nSPECIAL RULES FOR QUESTIONS:\n- The prompt provided is a question or direction. The student response will be an answer rather than a passage.\n- Extract exactly what the student wrote.\n- Provide the extracted answer as the field "answer".\n- Provide a short judgement field "is_answer_present" (true/false) indicating whether a direct answer was provided.\n- Do NOT attempt a word-by-word comparison with the question text.\n- Return ONLY a JSON object (no explanation). Include at minimum: "transcription", "answer", and "is_answer_present".`
      : baseSystem + `\n\nRules:\n- Extract text exactly as written, including spelling mistakes.\n- Compare word by word against the expected text.\n- Mark missing words as omissions.\n- Mark misspelled or wrong words as substitutions.\n- Return ONLY a JSON object with these fields:\n  - "transcription": the full text extracted from the image\n  - "words_correct": number of words matching the expected text\n  - "words_total": total number of expected words\n  - "accuracy_percentage": percentage of correct words (integer)\n  - "errors": array of objects with "expected", "actual", and "type" (omission/substitution/addition)`;

    const userPrompt2 = expectedText
      ? looksLikeQuestion(expectedText)
        ? `The student was expected to answer: "${expectedText}"\n\nPlease extract the student's written answer from the image and indicate if an answer is present.`
        : `The student was expected to write: "${expectedText}"\n\nPlease extract the text from this image and compare it against the expected text.`
      : `Please extract the text from this image.`;

    const systemPrompt = `You are an OCR and text comparison assistant for an Early Grade Reading/Math Assessment.
Your job is to:
1. Extract ALL text visible in the uploaded image (handwritten or printed).
2. Compare the extracted text against the expected text provided.

Rules:
- Extract text exactly as written, including spelling mistakes.
- Compare word by word against the expected text.
- Mark missing words as omissions.
- Mark misspelled or wrong words as substitutions.
- Return ONLY a JSON object with these fields:
  - "transcription": the full text extracted from the image
  - "words_correct": number of words matching the expected text
  - "words_total": total number of expected words
  - "accuracy_percentage": percentage of correct words (integer)
  - "errors": array of objects with "expected", "actual", and "type" (omission/substitution/addition)`;

    const userPrompt = `The student was expected to write: "${expectedText}"

Please extract the text from this image and compare it against the expected text.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt2 },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt2 },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { transcription: content };
    } catch {
      result = { transcription: content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OCR comparison error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
