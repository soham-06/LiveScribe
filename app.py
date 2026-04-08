import whisper

model = whisper.load_model("base")  # small & fast

result = model.transcribe("sample.mp3")

print("\nTRANSCRIPT:\n")
print(result["text"])