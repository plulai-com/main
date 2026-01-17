import { Badge } from "@/components/ui/badge"

export function HowItWorks() {
  const steps = [
    { num: "01", title: "Choose Your Path", desc: "Select a coding adventure that excites you." },
    { num: "02", title: "Complete Missions", desc: "Solve logic puzzles and write real code with your personal AI mentor." },
    { num: "03", title: "Earn Rewards", desc: "Collect XP, level up, and unlock new worlds." },
  ]

  return (
    <section className="py-24 bg-[#FDF6E3]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <Badge className="bg-[#FFD66B] text-slate-900 border-0 px-4 py-1 font-black uppercase ">
              The Journey
            </Badge>
            <h2 className="text-5xl font-black  uppercase tracking-tighter text-slate-900 leading-[0.9]">
              How Your <br /> Adventure <br /> Unfolds
            </h2>
            <p className="text-slate-600 text-lg font-bold">
              No boring lectures. Just missions that challenge your brain and build real skills.
            </p>
          </div>
          <div className="flex-1 space-y-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex gap-6 p-8 bg-white rounded-[2rem] border-4 border-slate-100 shadow-sm transform hover:-translate-y-1 transition-transform"
              >
                <span className="text-4xl font-black text-[#1CB0F6] ">{step.num}</span>
                <div>
                  <h4 className="text-xl font-black uppercase  text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-slate-500 font-bold">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
