import React, { useEffect, useRef, useState } from "react";

interface Props {
  onStop: (blob: Blob) => void;
}

export default function VoiceRecorder({ onStop }: Props) {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
        mediaRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Pick the best supported MIME type
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
      ? "audio/ogg;codecs=opus"
      : "audio/webm";

    const rec = new MediaRecorder(stream, { mimeType });
    mediaRef.current = rec;
    chunksRef.current = [];

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      onStop(blob);

      // release mic
      stream.getTracks().forEach((track) => track.stop());
    };

    rec.start();
    setRecording(true);
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={recording ? stop : start}
      className={`px-3 py-2 rounded-full text-sm ${
        recording ? "bg-red-600" : "bg-blue-600"
      }`}
      title={recording ? "Stop" : "Record voice"}
    >
      {recording ? "■ Stop" : "● Voice"}
    </button>
  );
}
