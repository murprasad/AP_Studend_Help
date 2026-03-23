import { FadeIn } from "@/components/landing/fade-in";

const testimonials = [
  {
    name: "Marcus T.",
    role: "Sophomore, UT Austin",
    quote:
      "I passed 4 CLEPs over winter break. Entered spring semester with 12 extra credits. My advisor couldn\u2019t believe it.",
    metric: "4 exams passed",
    timeline: "3 weeks total",
    context: "Credit Hacker",
    initials: "MT",
    avatarColor: "bg-emerald-600",
    style: "quote" as const,
  },
  {
    name: "Priya K.",
    role: "Working Mom, Age 34",
    quote:
      "I studied after the kids went to bed. Passed College Algebra on my first try. One exam down, two more to go.",
    metric: "$1,200 saved",
    timeline: "9 days of prep",
    context: "Adult Learner",
    initials: "PK",
    avatarColor: "bg-teal-600",
    style: "border" as const,
  },
  {
    name: "SSgt. Davis",
    role: "USAF Active Duty",
    quote:
      "DANTES covered my exam fee. StudentNest covered the prep. Earned 6 credits without spending a dime.",
    metric: "6 credits earned",
    timeline: "Free via DANTES",
    context: "Military",
    initials: "SD",
    avatarColor: "bg-blue-600",
    style: "quote" as const,
  },
  {
    name: "Sofia R.",
    role: "High School Senior, CA",
    quote:
      "I\u2019m starting college with 15 credits already done. My parents are saving thousands on tuition.",
    metric: "15 credits banked",
    timeline: "1 summer of prep",
    context: "High Schooler",
    initials: "SR",
    avatarColor: "bg-violet-600",
    style: "border" as const,
  },
];

const staggerDelays = [
  "delay-0",
  "delay-100",
  "delay-200",
  "delay-300",
];

export function CLEPTestimonials() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} className={staggerDelays[i]}>
              {t.style === "quote" ? (
                <div className="relative rounded-2xl bg-white/5 p-8">
                  <span className="absolute top-4 left-6 text-6xl font-serif text-emerald-500/30 leading-none select-none">
                    &ldquo;
                  </span>

                  <div className="relative pt-8">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-3">
                      {t.context}
                    </p>

                    <blockquote className="text-lg text-white/90 leading-relaxed mb-5">
                      {t.quote}
                    </blockquote>

                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-full ${t.avatarColor} flex items-center justify-center text-sm font-bold text-white`}
                      >
                        {t.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-xs text-white/50">{t.role}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">
                        {t.metric}
                      </span>
                      <span className="text-xs bg-white/5 text-white/60 px-2.5 py-1 rounded-full">
                        {t.timeline}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/5 border-l-4 border-emerald-500 p-8">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-3">
                    {t.context}
                  </p>

                  <blockquote className="text-lg text-white/90 leading-relaxed mb-5">
                    {t.quote}
                  </blockquote>

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full ${t.avatarColor} flex items-center justify-center text-sm font-bold text-white`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      <p className="text-xs text-white/50">{t.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">
                      {t.metric}
                    </span>
                    <span className="text-xs bg-white/5 text-white/60 px-2.5 py-1 rounded-full">
                      {t.timeline}
                    </span>
                  </div>
                </div>
              )}
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
