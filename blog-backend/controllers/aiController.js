const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// HELPER réutilisable
const callAI = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
  });
  return response.choices[0].message.content;
};

// POST /api/ai/generate
const generateArticle = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === '')
      return res.status(400).json({ message: 'Titre obligatoire' });

    const prompt = `Tu es un blogueur professionnel créatif.
Génère un article de blog COMPLET en français sur : "${title}"
Structure obligatoire :
- Introduction accrocheuse (2-3 phrases)
- 3 sections avec sous-titres (##)
- Exemples concrets
- Conclusion inspirante
Règles : écris en français, paragraphes courts, ajoute des emojis, ton engageant.
Réponds UNIQUEMENT avec le contenu, sans le titre.`;

    const content = await callAI(prompt);
    const suggestions = [
      { id: 'humoristique',   label: '😄 Humoristique' },
      { id: 'professionnel',  label: '💼 Professionnel' },
      { id: 'motivant',       label: '🚀 Motivant' },
      { id: 'informatif',     label: '📚 Informatif' },
      { id: 'storytelling',   label: '📖 Storytelling' },
      { id: 'journalistique', label: '📰 Journalistique' }
    ];
    res.json({ content, suggestions });
  } catch (error) {
    console.error('Erreur generateArticle:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/improve
const improveArticle = async (req, res) => {
  try {
    const { content, style } = req.body;
    if (!content || content.trim() === '')
      return res.status(400).json({ message: 'Contenu obligatoire' });

    const styleInstructions = {
      'humoristique':   'Ajoute de l\'humour subtil, des métaphores amusantes et des emojis drôles 😄',
      'professionnel':  'Utilise un vocabulaire soutenu, reste factuel et objectif 💼',
      'motivant':       'Phrases percutantes, appels à l\'action, émojis énergiques 🚀💪',
      'informatif':     'Points numérotés, exemples concrets, définitions claires 📚',
      'storytelling':   'Raconte une histoire, crée du suspense, utilise des dialogues 📖',
      'journalistique': 'Qui? Quoi? Où? Quand? Pourquoi? Style article de presse 📰'
    };
    const styleGuide = styleInstructions[style] || 'Améliore la fluidité, corrige les fautes, rends le texte plus dynamique';

    const prompt = `Tu es un éditeur professionnel expert.
Style demandé : ${style || 'amélioration générale'}
Instructions : ${styleGuide}
Règles : corrige les fautes, garde le sens original, améliore les transitions.
Texte à améliorer : "${content}"
Réponds UNIQUEMENT avec le texte amélioré.`;

    const [improved, motivating, funny] = await Promise.all([
      callAI(prompt),
      callAI(`Réécris en 2-3 phrases TRÈS motivantes en français : "${content.substring(0, 200)}"`),
      callAI(`Réécris en 2-3 phrases HUMORISTIQUES en français : "${content.substring(0, 200)}"`)
    ]);

    res.json({
      content: improved,
      alternatives: [
        { label: '🚀 Version motivante',    text: motivating },
        { label: '😄 Version humoristique', text: funny }
      ]
    });
  } catch (error) {
    console.error('Erreur improveArticle:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/summarize
const summarizeArticle = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Contenu obligatoire' });

    const prompt = `Résume ce texte en français de 3 façons.
Texte : "${content}"
Réponds UNIQUEMENT avec ce JSON valide (pas de backticks) :
{"short":"1 phrase max 20 mots","medium":"2-3 phrases","keyPoints":["point 1","point 2","point 3"]}`;

    const result = await callAI(prompt);
    const clean  = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (error) {
    console.error('Erreur summarize:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/tags
const suggestTags = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content)
      return res.status(400).json({ message: 'Titre ou contenu obligatoire' });

    const prompt = `Suggère 8 tags pour cet article.
Titre : "${title || ''}"
Contenu : "${content ? content.substring(0, 300) : ''}"
Réponds UNIQUEMENT avec les tags séparés par des virgules, en minuscules.
Exemple : technologie, react, javascript, web, tutoriel, code, dev, 2024`;

    const result = await callAI(prompt);
    const tags = result
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0 && t.length < 30);
    res.json({ tags });
  } catch (error) {
    console.error('Erreur suggestTags:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/comment
const suggestComment = async (req, res) => {
  try {
    const { articleTitle } = req.body;
    if (!articleTitle) return res.status(400).json({ message: 'Titre obligatoire' });

    const [normal, funny, deep] = await Promise.all([
      callAI(`Génère UN commentaire naturel (2 phrases max) en français pour : "${articleTitle}". Réponds uniquement avec le commentaire.`),
      callAI(`Génère UN commentaire humoristique (2 phrases max) en français pour : "${articleTitle}". Réponds uniquement avec le commentaire.`),
      callAI(`Génère UN commentaire profond et réfléchi (2 phrases max) en français pour : "${articleTitle}". Réponds uniquement avec le commentaire.`)
    ]);

    res.json({
      suggestions: [
        { label: '💬 Normal',       text: normal },
        { label: '😄 Humoristique', text: funny },
        { label: '🧠 Réfléchi',     text: deep }
      ]
    });
  } catch (error) {
    console.error('Erreur suggestComment:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/chat
const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: 'Message obligatoire' });

    const messages = [
      {
        role: 'system',
        content: `Tu es un assistant expert en rédaction de blog.
Tu aides à écrire, améliorer et structurer des articles.
Tu réponds en français, de façon amicale et concise (3-4 phrases max).
Tu utilises des emojis pour rendre la conversation vivante.`
      },
      ...history.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Erreur chatWithAI:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/check
const checkContent = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Texte obligatoire' });

    const prompt = `Analyse si ce texte est approprié.
Texte : "${text}"
Réponds UNIQUEMENT avec ce JSON (sans backticks) :
{"appropriate":true,"reason":""}
ou
{"appropriate":false,"reason":"explication"}`;

    const result = await callAI(prompt);
    const clean  = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (error) {
    console.error('Erreur checkContent:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateArticle,
  improveArticle,
  summarizeArticle,
  suggestTags,
  suggestComment,
  chatWithAI,
  checkContent
};