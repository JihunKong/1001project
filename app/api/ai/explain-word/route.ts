import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ['LEARNER', 'WRITER'];
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. This feature is for learners and writers only.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { word, context, language = 'en' } = body;

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    if (word.length > 50) {
      return NextResponse.json(
        { error: 'Word is too long' },
        { status: 400 }
      );
    }

    const systemPrompt = getSystemPrompt(language);
    const userPrompt = context
      ? `Explain the word "${word}" in context: "${context}"`
      : `Explain the word "${word}"`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const explanation = response.choices[0].message.content;

    return NextResponse.json({
      word,
      explanation,
      language
    });
  } catch (error) {
    console.error('Error explaining word:', error);
    return NextResponse.json(
      { error: 'Failed to explain word' },
      { status: 500 }
    );
  }
}

function getSystemPrompt(language: string): string {
  const prompts: Record<string, string> = {
    en: 'You are a helpful vocabulary tutor for young learners. Explain words simply and clearly. Format: Definition (1 sentence), Example sentence, Difficulty level (Easy/Medium/Hard).',
    ko: '당신은 어린 학습자를 위한 친절한 어휘 선생님입니다. 단어를 간단하고 명확하게 설명하세요. 형식: 정의 (1문장), 예문, 난이도 (쉬움/보통/어려움).',
    es: 'Eres un tutor de vocabulario útil para jóvenes estudiantes. Explica las palabras de manera simple y clara. Formato: Definición (1 oración), Oración de ejemplo, Nivel de dificultad (Fácil/Medio/Difícil).',
    ar: 'أنت مدرس مفردات مفيد للمتعلمين الصغار. اشرح الكلمات ببساطة ووضوح. التنسيق: التعريف (جملة واحدة)، جملة مثال، مستوى الصعوبة (سهل/متوسط/صعب).',
    hi: 'आप युवा शिक्षार्थियों के लिए एक सहायक शब्दावली शिक्षक हैं। शब्दों को सरल और स्पष्ट रूप से समझाएं। प्रारूप: परिभाषा (1 वाक्य), उदाहरण वाक्य, कठिनाई स्तर (आसान/मध्यम/कठिन).',
    fr: 'Vous êtes un tuteur de vocabulaire utile pour les jeunes apprenants. Expliquez les mots simplement et clairement. Format : Définition (1 phrase), Phrase d\'exemple, Niveau de difficulté (Facile/Moyen/Difficile).',
    de: 'Sie sind ein hilfreicher Vokabeltutor für junge Lernende. Erklären Sie Wörter einfach und klar. Format: Definition (1 Satz), Beispielsatz, Schwierigkeitsgrad (Leicht/Mittel/Schwer).',
    ja: 'あなたは若い学習者のための役立つ語彙チューターです。単語をシンプルかつ明確に説明してください。形式：定義（1文）、例文、難易度（簡単/普通/難しい）。',
    pt: 'Você é um tutor de vocabulário útil para jovens alunos. Explique as palavras de forma simples e clara. Formato: Definição (1 frase), Frase de exemplo, Nível de dificuldade (Fácil/Médio/Difícil).',
    ru: 'Вы полезный репетитор по лексике для юных учеников. Объясняйте слова просто и ясно. Формат: Определение (1 предложение), Пример предложения, Уровень сложности (Легкий/Средний/Сложный).',
    it: 'Sei un tutor di vocabolario utile per giovani studenti. Spiega le parole in modo semplice e chiaro. Formato: Definizione (1 frase), Frase di esempio, Livello di difficoltà (Facile/Medio/Difficile).',
    zh: '你是一位有用的词汇导师，为年轻学习者服务。简单明了地解释单词。格式：定义（1句话），例句，难度级别（简单/中等/困难）。'
  };

  return prompts[language] || prompts.en;
}
