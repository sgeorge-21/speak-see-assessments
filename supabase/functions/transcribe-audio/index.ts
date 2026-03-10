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
    const audioFile = formData.get("audio") as File;
    const expectedText = (formData.get("expectedText") as string) || "";

    const looksLikeQuestion = (s: string) => {
      if (!s) return false;
      const trimmed = s.trim().toLowerCase();
      if (trimmed.includes("?")) return true;
      return /^(where|what|who|when|why|how|which|whom|did|do|does|is|are|was|were)\b/.test(trimmed);
    };

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert audio to base64 in chunks to avoid stack overflow
    const arrayBuffer = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64Audio = btoa(binary);

    // Base system prompt for reading tasks
    const baseSystem = `You are a speech-to-text transcription assistant for Early Grade Reading and Math Assessments (EGRA/EGMA).
Your job is to accurately transcribe what the student says.`;

    // If the prompt looks like a question, instruct the model to focus on extracting the student's answer
    const systemPrompt = looksLikeQuestion(expectedText)
      ? baseSystem + `\n\nSPECIAL RULES FOR QUESTIONS:\n- The prompt provided is a question or direction. The student will respond with an answer rather than reading a passage.\n- Transcribe EXACTLY what the student says.\n- Extract the student's direct answer as the field "answer".\n- Provide a short judgement field "is_answer_present" (true/false) indicating whether a direct answer was given.\n- Do NOT attempt to compare the student's words to the question text word-for-word.\n- Return ONLY a JSON object (no explanation). Include at minimum: "transcription", "answer", and "is_answer_present".`
      : baseSystem + `\n\nCRITICAL RULES:\n- Transcribe EXACTLY what the student says, even if they mispronounce, skip, or substitute words.\n- If the student says a word differently from expected, record what they ACTUALLY said as the "actual" value.\n- If the student skips/omits a word entirely, mark it with actual "[skipped]" and type "omission".\n- If the student says a completely different word, mark type as "substitution".\n- If the student mispronounces a word (close but wrong), mark type as "mispronunciation".\n- Compare EVERY expected word against what was spoken. The "words_total" must equal the number of words in the expected text.\n- A word is "correct" ONLY if it matches the expected word (case-insensitive, ignoring punctuation).\n- Even if the student reads poorly or gets everything wrong, you MUST still return valid JSON with the comparison.\n\nReturn ONLY a valid JSON object with these fields:\n  - "transcription": string - the full transcription of what was actually said\n  - "words_correct": number - count of words that match expected text\n  - "words_total": number - total number of expected words\n  - "accuracy_percentage": number - integer percentage of correct words\n  - "errors": array of objects, each with:\n    - "expected": the word that should have been said\n    - "actual": what the student actually said (or "[skipped]" if omitted)\n    - "type": one of "mispronunciation", "omission", or "substitution"\n\nIMPORTANT: Do NOT return anything other than the JSON object. No markdown, no explanation.`;

    const userPrompt = expectedText
      ? looksLikeQuestion(expectedText)
        ? `The student was asked: "${expectedText}"\n\nPlease transcribe the audio, extract the student's direct answer, and indicate if an answer was provided.`
        : `The student was asked to read: "${expectedText}"\n\nPlease transcribe the audio and compare against the expected text.`
      : `Please transcribe the audio recording of a student reading aloud.`;

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
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "input_audio",
                  input_audio: {
                    data: base64Audio,
                    format: "wav",
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
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
    console.error("Transcription error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
