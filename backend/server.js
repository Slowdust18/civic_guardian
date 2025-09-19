import dotenv from "dotenv";
dotenv.config();
import express from "express";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config(); // loads your AssemblyAI API key from .env
const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 5000;
const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;

app.use(cors()); // allow requests from your frontend

// Endpoint to handle audio transcription
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const fileData = fs.readFileSync(req.file.path);

    // Upload audio to AssemblyAI
    const uploadResp = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: ASSEMBLY_API_KEY },
      body: fileData,
    });
    const uploadData = await uploadResp.json();

    // Request transcription
    const transcriptResp = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: ASSEMBLY_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadData.upload_url }),
    });
    const transcriptData = await transcriptResp.json();

    // Poll until transcription is complete
    let finalTranscript = "";
    while (true) {
      const statusResp = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`,
        { headers: { authorization: ASSEMBLY_API_KEY } }
      );
      const statusData = await statusResp.json();

      if (statusData.status === "completed") {
        finalTranscript = statusData.text;
        break;
      } else if (statusData.status === "error") {
        throw new Error("Transcription failed");
      }
      await new Promise((r) => setTimeout(r, 1000)); // wait 1 sec
    }

    res.json({ transcript: finalTranscript });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error transcribing audio");
  } finally {
    if (req.file?.path) fs.unlinkSync(req.file.path); // clean up temp file
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
