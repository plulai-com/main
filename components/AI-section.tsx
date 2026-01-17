import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BlooAvatarProps {
  mood?: "happy" | "neutral" | "excited";
  size?: "sm" | "md" | "lg";
}

const BlooAvatar = ({ mood = "happy", size = "md" }: BlooAvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const moodColors = {
    happy: "bg-gradient-to-br from-[#1CB0F6] to-[#14D4F4]",
    neutral: "bg-gradient-to-br from-[#1CB0F6] to-[#14D4F4]",
    excited: "bg-gradient-to-br from-[#1CB0F6] to-[#14D4F4]",
  };

  return (
    <div className={`${sizeClasses[size]} ${moodColors[mood]} rounded-full flex items-center justify-center`}>
      <span className="text-white font-black text-xs">B</span>
    </div>
  );
};

interface AIMentorProps {
  className?: string;
}

const AIMentor = ({ className = "" }: AIMentorProps) => {
  return (
    <section id="bloo" className={`py-24 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-[2.5rem] border border-slate-200 p-8 md:p-16 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1CB0F6]/10 blur-[80px] rounded-full" />

          <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
            <Badge className="bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/20 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] italic">
              Meet Your Mentor
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
              AI Guidance That <br />
              <span className="text-[#1CB0F6]">Speaks Your Language</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1CB0F6]" />
                <p className="font-bold text-slate-700">Available in Arabic, English, and French</p>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1CB0F6]" />
                <p className="font-bold text-slate-700">Motivational & Non-judgmental Personality</p>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1CB0F6]" />
                <p className="font-bold text-slate-700">24/7 Coding Support & Motivation</p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-[#1CB0F6] hover:bg-[#14D4F4] text-white font-black uppercase tracking-widest italic h-14 px-8"
            >
              Get Started With Bloo
            </Button>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end relative">
            <div className="w-full max-w-sm aspect-square rounded-[2rem] bg-white border border-slate-200 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <BlooAvatar mood="happy" size="sm" />
                <div>
                  <h4 className="font-black uppercase tracking-tight text-sm italic text-slate-900">Bloo AI</h4>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[8px] py-0 px-1">
                    ONLINE
                  </Badge>
                </div>
              </div>
              <div className="space-y-4 overflow-hidden">
                <div className="bg-[#1CB0F6] text-white px-4 py-3 rounded-2xl rounded-bl-none text-sm font-bold max-w-[80%]">
                  Wow! You just completed your first loop! You're basically a wizard now! 🧙‍♂️✨
                </div>
                <div className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl rounded-br-none text-sm font-bold max-w-[80%] ml-auto">
                  Thanks Bloo! What's next?
                </div>
                <div className="bg-[#1CB0F6] text-white px-4 py-3 rounded-2xl rounded-bl-none text-sm font-bold max-w-[80%]">
                  Ready for the Logic Dungeon? It's where the real magic happens! 🏰💎
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIMentor;