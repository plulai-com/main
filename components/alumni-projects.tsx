"use client"

import { ExternalLink, Github, Star, Users, Code } from "lucide-react"

interface Project {
  title: string
  description: string
  builtWith: string[]
  githubStars: number
  liveUrl: string
  githubUrl: string
  creator: string
  creatorRole: string
  imageColor: string
}

export function AlumniProjects() {
  const projects: Project[] = [
    {
      title: "EcoMarket",
      description: "Sustainable e-commerce platform with carbon footprint tracking and eco-friendly product recommendations.",
      builtWith: ["Next.js", "TypeScript", "Tailwind", "Stripe", "MongoDB"],
      githubStars: 428,
      liveUrl: "https://ecomarket.example.com",
      githubUrl: "https://github.com/alumni/ecomarket",
      creator: "Sarah Chen",
      creatorRole: "Former Marketing Manager → Full-Stack Developer",
      imageColor: "bg-gradient-to-br from-green-400 to-emerald-600",
    },
    {
      title: "CodeCollab",
      description: "Real-time collaborative coding platform with AI-powered code review and pair programming features.",
      builtWith: ["React", "Node.js", "Socket.io", "Redis", "Docker"],
      githubStars: 892,
      liveUrl: "https://codecollab.example.com",
      githubUrl: "https://github.com/alumni/codecollab",
      creator: "Alex Rivera",
      creatorRole: "Former Teacher → Senior Developer @ Google",
      imageColor: "bg-gradient-to-br from-blue-400 to-purple-600",
    },
    {
      title: "HealthTrack Pro",
      description: "Comprehensive health monitoring app with AI predictions and integration with wearable devices.",
      builtWith: ["React Native", "Python", "FastAPI", "PostgreSQL", "AWS"],
      githubStars: 567,
      liveUrl: "https://healthtrack.example.com",
      githubUrl: "https://github.com/alumni/healthtrack",
      creator: "Dr. Maya Patel",
      creatorRole: "Former Doctor → Health Tech Founder",
      imageColor: "bg-gradient-to-br from-pink-400 to-rose-600",
    },
    {
      title: "LearnLingo AI",
      description: "AI-powered language learning platform with real-time pronunciation feedback and personalized lessons.",
      builtWith: ["Vue.js", "Python", "OpenAI API", "Firebase", "TensorFlow.js"],
      githubStars: 731,
      liveUrl: "https://learnlingo.example.com",
      githubUrl: "https://github.com/alumni/learnlingo",
      creator: "Kenji Tanaka",
      creatorRole: "Former Translator → AI Engineer",
      imageColor: "bg-gradient-to-br from-amber-400 to-orange-600",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white">
            Alumni Success Stories
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            See what our graduates have built after completing their Plulai journey.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-3xl border-4 border-slate-700 overflow-hidden hover:border-[#1CB0F6] transition-all duration-300 group"
            >
              {/* Project Header */}
              <div className="p-8 border-b border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-xl ${project.imageColor}`} />
                      <div>
                        <h3 className="text-2xl font-black text-white">{project.title}</h3>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-bold">{project.githubStars} stars</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-lg">{project.description}</p>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {project.builtWith.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-bold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project Footer */}
              <div className="p-8 bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-white font-black">{project.creator}</div>
                    <div className="text-slate-400 text-sm">{project.creatorRole}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-full font-bold hover:bg-slate-600 transition-colors"
                    >
                      <Github className="w-5 h-5" />
                      Code
                    </a>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-[#1CB0F6] text-white rounded-full font-bold hover:bg-[#14D4F4] transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Live Demo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alumni Statistics */}
        {/* <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#1CB0F6] to-[#14D4F4] rounded-3xl p-8">
            <h3 className="text-2xl font-black italic text-white mb-8 text-center">
              Our Alumni Impact
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-black text-white">85%</div>
                <div className="text-white/90 font-bold">Career Changers</div>
                <div className="text-white/70 text-sm">Switched to tech careers</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black text-white">$94K</div>
                <div className="text-white/90 font-bold">Average Salary</div>
                <div className="text-white/70 text-sm">After 1 year</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black text-white">200+</div>
                <div className="text-white/90 font-bold">Startups Founded</div>
                <div className="text-white/70 text-sm">By our alumni</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black text-white">50K+</div>
                <div className="text-white/90 font-bold">GitHub Contributions</div>
                <div className="text-white/70 text-sm">Open source impact</div>
              </div>
            </div>
          </div> */}

          {/* CTA */}
          {/* <div className="text-center mt-12">
            <p className="text-slate-300 text-xl mb-6">
              Ready to build your own success story?
            </p>
            <button className="bg-white text-slate-900 px-10 py-4 rounded-full text-xl font-black uppercase italic hover:bg-slate-100 transition-colors inline-flex items-center gap-3">
              <Code className="w-6 h-6" />
              Start Your Journey Today
            </button>
          </div>
        </div> */}
      </div>
    </section>
  )
}