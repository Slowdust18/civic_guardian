#from fastapi import APIRouter, UploadFile, File, HTTPException
#from openai import OpenAI
#import os

#router = APIRouter()
#client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

#@router.post("/transcribe")
#async def transcribe_audio(audio: UploadFile = File(...)):
 #   try:
        # Save temporarily
  #      with open("temp_audio.wav", "wb") as f:
   #         f.write(await audio.read())

        # Send to OpenAI Whisper
    ##       transcript = client.audio.transcriptions.create(
      #          model="whisper-1",
       #         file=f
 #           )
#
  #      return {"transcript": transcript.text}

   # except Exception as e:
    #    print("❌ Transcription error:", e)   # <--- log the exact error
     #   raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
