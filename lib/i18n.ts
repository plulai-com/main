export type Language = "en" | "ar" | "fr"

export const translations = {
  en: {
    hero: {
      title: "Future Creators Start Here",
      subtitle: "The coding adventure for Gen Alpha. Complete epic missions, earn XP, and unlock your potential.",
      cta: "Start Mission",
      demo: "Watch Demo",
    },
    features: {
      title: "Gamified To The Core",
      items: [
        { title: "Adventure Maps", desc: "Learn through themed missions." },
        { title: "XP & Rewards", desc: "Earn XP for every challenge." },
        { title: "AI Mentor", desc: "Real-time feedback from Bloo." },
      ],
    },
  },
  ar: {
    hero: {
      title: "صناع المستقبل يبدأون من هنا",
      subtitle: "مغامرة البرمجة للجيل ألفا. أكمل مهمات ملحمية، واكسب نقاط خبرة، وأطلق العنان لإمكانياتك.",
      cta: "ابدأ المهمة",
      demo: "شاهد العرض",
    },
    features: {
      title: "اللعب في صميم التعلم",
      items: [
        { title: "خرائط المغامرة", desc: "تعلم من خلال مهمات ذات طابع خاص." },
        { title: "الخبرة والمكافآت", desc: "اكسب نقاط خبرة لكل تحدٍ." },
        { title: "مرشد ذكاء اصطناعي", desc: "ملاحظات فورية من بلو." },
      ],
    },
  },
  fr: {
    hero: {
      title: "Les Créateurs du Futur Commencent Ici",
      subtitle: "L'aventure du code pour la génération Alpha. Accomplissez des missions, gagnez de l'XP.",
      cta: "Commencer la Mission",
      demo: "Voir la Démo",
    },
    features: {
      title: "Le Jeu au Cœur de l'Apprentissage",
      items: [
        { title: "Cartes d'Aventure", desc: "Apprenez via des missions thématiques." },
        { title: "XP et Récompenses", desc: "Gagnez de l'XP pour chaque défi." },
        { title: "Mentor IA", desc: "Feedback en temps réel de Bloo." },
      ],
    },
  },
}
