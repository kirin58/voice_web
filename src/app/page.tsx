"use client";

import { useEffect, useRef, useState } from "react";
// import ไอคอนที่เหมาะกับร้านเฟอร์นิเจอร์
import { Mic, Square, User, Armchair, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";

type ApiResult = {
  transcript?: string;
  answer?: string;
  matches?: Array<any>;
  error?: string;
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("แตะที่ไมค์เพื่อเริ่มค้นหา");
  const [result, setResult] = useState<ApiResult>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("เบราว์เซอร์ไม่รองรับ (กรุณาใช้ Chrome)");
      setResult({ error: "Browser not supported" });
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setIsProcessing(false);
      setStatus("กำลังฟัง... (เช่น โซฟา, เตียงนอน)");
    };

    rec.onend = () => {
      setIsListening(false);
      if (!isProcessing) {
         setStatus("แตะที่ไมค์เพื่อถามใหม่");
      }
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setIsProcessing(false);
      const isNoSpeech = e?.error === 'no-speech';
      setStatus(isNoSpeech ? "ไม่ได้ยินเสียง ลองใหม่นะครับ" : "เกิดข้อขัดข้อง");
      if (!isNoSpeech) setResult({ error: e?.error });
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (!transcript.trim()) return;

      setStatus("กำลังค้นหาเฟอร์นิเจอร์...");
      setIsProcessing(true);
      setResult({ transcript });

      try {
        const resp = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript }),
        });

        if (!resp.ok) throw new Error("API Error");

        const data: ApiResult = await resp.json();
        setResult(data);
        setStatus(data.error ? "ขออภัย พบปัญหาบางอย่าง" : "ค้นหาสำเร็จ");
      } catch (err) {
        setResult({ ...result, error: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" });
        setStatus("การเชื่อมต่อล้มเหลว");
      } finally {
        setIsProcessing(false);
      }
    };

    recognitionRef.current = rec;
  }, [isProcessing, result]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setResult({}); 
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    // เปลี่ยนพื้นหลังเป็นสี Stone (เทาอมน้ำตาล) ให้ความรู้สึก Modern Luxury
    <main className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4 md:p-8 font-sans">
      
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl shadow-stone-200/50 p-6 md:p-12 space-y-8 relative overflow-hidden">
        
        {/* Decorative Background Blob */}
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        {/* Header */}
        <header className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-amber-50 rounded-full mb-2 shadow-sm">
            <Armchair className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 tracking-tight">
            CozyHome <span className="text-amber-600">Assistant</span>
          </h1>
          <p className="text-stone-500 text-sm md:text-base max-w-md mx-auto font-light">
            แต่งบ้านในฝันได้ง่ายๆ เพียงแค่บอกเรา
          </p>
        </header>

        {/* Voice Controller */}
        <section className="flex flex-col items-center justify-center space-y-6 py-2">
          <div className="relative group">
            {isListening && (
              <>
                <span className="absolute top-0 left-0 w-full h-full rounded-full bg-amber-400 animate-ping opacity-20 duration-1000"></span>
                <span className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] rounded-full bg-amber-200 animate-ping opacity-10 delay-150 duration-1000"></span>
              </>
            )}
            
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full shadow-lg transition-all duration-300 ease-out transform
                ${isListening
                  ? "bg-rose-500 text-white scale-110 shadow-rose-200" 
                  : "bg-stone-800 text-white hover:bg-amber-600 hover:scale-105 shadow-stone-300"
                } ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isListening ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </button>
          </div>

          <div className={`text-center text-sm font-medium tracking-wide transition-colors duration-300 ${isListening ? "text-amber-600" : "text-stone-400"}`}>
            {status}
          </div>
        </section>

        {/* Conversation Area */}
        <section className="space-y-5 border-t border-stone-100 pt-8 min-h-[200px]">
          
          {/* User Input */}
          {result.transcript && (
            <div className="flex gap-4 items-end justify-end animate-in slide-in-from-bottom-2 fade-in duration-500">
              <div className="bg-stone-100 text-stone-700 py-3 px-5 rounded-2xl rounded-tr-sm max-w-[80%] text-right shadow-sm">
                <p className="text-sm md:text-base">{result.transcript}</p>
              </div>
              <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-stone-500" />
              </div>
            </div>
          )}

          {/* AI Response */}
          {(result.answer || result.error || isProcessing) && (
            <div className="flex gap-4 items-start animate-in slide-in-from-bottom-2 fade-in duration-500 delay-75">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${result.error ? 'bg-red-100' : 'bg-amber-600'}`}>
                 {result.error ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Sparkles className="w-4 h-4 text-white" />}
               </div>
              
              <div className={`py-4 px-6 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm ${
                result.error 
                    ? "bg-red-50 text-red-800 border border-red-100" 
                    : "bg-amber-50/80 text-stone-800 border border-amber-100"
                }`}>
                  
                  {isProcessing && !result.answer && !result.error ? (
                     <div className="flex space-x-1.5 py-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                  ) : (
                    <div className="prose prose-stone prose-sm">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {result.error || result.answer}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {!result.transcript && !isListening && (
            <div className="text-center py-8 opacity-40 flex flex-col items-center">
                <ShoppingBag className="w-12 h-12 mb-2 text-stone-300"/>
                <p className="text-sm text-stone-400">ยังไม่มีรายการสนทนา</p>
            </div>
          )}

        </section>

        {/* Footer Hint */}
        <footer className="text-center border-t border-stone-100 pt-6">
           <p className="text-xs text-stone-400 font-light">
             <span className="font-semibold text-amber-500">Tip:</span> ลองถามว่า "มีโซฟาตัว L สีเทาไหม" หรือ "แนะนำเตียง 6 ฟุตหน่อย"
           </p>
        </footer>

      </div>
    </main>
  );
}