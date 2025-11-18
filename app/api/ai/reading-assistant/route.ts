import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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
    const { bookId, message, chatHistory = [], language = 'en' } = body;

    if (!bookId || typeof bookId !== 'string') {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Get book information
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        authorName: true,
        summary: true,
        category: true,
        language: true,
        ageRange: true,
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Build conversation context
    const systemPrompt = getSystemPrompt(language, book);

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiResponse = response.choices[0].message.content;

    return NextResponse.json({
      response: aiResponse,
      bookId,
      language
    });
  } catch (error) {
    console.error('Error in reading assistant:', error);
    return NextResponse.json(
      { error: 'Failed to get response from reading assistant' },
      { status: 500 }
    );
  }
}

function getSystemPrompt(language: string, book: any): string {
  const bookInfo = `
Book Title: ${book.title}
Author: ${book.authorName}
Summary: ${book.summary || 'Not available'}
Categories: ${book.category?.join(', ') || 'Not specified'}
Age Range: ${book.ageRange || 'Not specified'}
`;

  const prompts: Record<string, string> = {
    en: `You are a helpful reading tutor for young learners (ages ${book.ageRange || 'general'}).
You are helping them understand this book:
${bookInfo}

Your role:
- Answer questions about the story, characters, themes, and plot
- Explain difficult concepts in simple terms
- Encourage critical thinking with follow-up questions
- Keep responses concise (2-3 sentences max)
- Be encouraging and supportive
- If asked about something not in the book, gently redirect to the story

Important: Base your answers on the book information provided above.`,

    ko: `당신은 어린 학습자 (${book.ageRange || '일반'}세)를 위한 친절한 독서 선생님입니다.
다음 책에 대해 도와주고 있습니다:
${bookInfo}

당신의 역할:
- 이야기, 등장인물, 주제, 줄거리에 대한 질문에 답하기
- 어려운 개념을 간단한 용어로 설명하기
- 후속 질문으로 비판적 사고 장려하기
- 답변을 간결하게 유지하기 (최대 2-3문장)
- 격려하고 지원하기
- 책에 없는 내용을 묻는 경우 이야기로 부드럽게 돌아가기

중요: 위에 제공된 책 정보를 바탕으로 답변하세요.`,

    es: `Eres un tutor de lectura útil para jóvenes estudiantes (edades ${book.ageRange || 'general'}).
Estás ayudándoles a comprender este libro:
${bookInfo}

Tu papel:
- Responder preguntas sobre la historia, personajes, temas y trama
- Explicar conceptos difíciles en términos simples
- Fomentar el pensamiento crítico con preguntas de seguimiento
- Mantener respuestas concisas (máximo 2-3 oraciones)
- Ser alentador y solidario
- Si preguntan sobre algo que no está en el libro, redirigir suavemente a la historia`,

    ar: `أنت مدرس قراءة مفيد للمتعلمين الصغار (أعمار ${book.ageRange || 'عام'}).
أنت تساعدهم على فهم هذا الكتاب:
${bookInfo}

دورك:
- الإجابة على الأسئلة حول القصة والشخصيات والموضوعات والحبكة
- شرح المفاهيم الصعبة بمصطلحات بسيطة
- تشجيع التفكير النقدي بأسئلة متابعة
- إبقاء الإجابات موجزة (2-3 جمل كحد أقصى)
- كن مشجعًا وداعمًا
- إذا سألوا عن شيء ليس في الكتاب، أعد توجيههم بلطف إلى القصة`,

    hi: `आप युवा शिक्षार्थियों (आयु ${book.ageRange || 'सामान्य'}) के लिए एक सहायक पठन शिक्षक हैं।
आप उन्हें इस पुस्तक को समझने में मदद कर रहे हैं:
${bookInfo}

आपकी भूमिका:
- कहानी, पात्रों, विषयों और कथानक के बारे में प्रश्नों के उत्तर दें
- कठिन अवधारणाओं को सरल शब्दों में समझाएं
- अनुवर्ती प्रश्नों के साथ आलोचनात्मक सोच को प्रोत्साहित करें
- उत्तर संक्षिप्त रखें (अधिकतम 2-3 वाक्य)
- उत्साहजनक और सहायक बनें
- यदि पुस्तक में नहीं है कुछ पूछा जाए, तो धीरे से कहानी पर वापस निर्देशित करें`,

    fr: `Vous êtes un tuteur de lecture utile pour les jeunes apprenants (âgés ${book.ageRange || 'général'}).
Vous les aidez à comprendre ce livre :
${bookInfo}

Votre rôle :
- Répondre aux questions sur l'histoire, les personnages, les thèmes et l'intrigue
- Expliquer les concepts difficiles en termes simples
- Encourager la pensée critique avec des questions de suivi
- Garder les réponses concises (2-3 phrases max)
- Être encourageant et solidaire
- Si on vous pose une question sur quelque chose qui n'est pas dans le livre, redirigez doucement vers l'histoire`,

    de: `Sie sind ein hilfreicher Lesetutor für junge Lernende (Alter ${book.ageRange || 'allgemein'}).
Sie helfen ihnen, dieses Buch zu verstehen:
${bookInfo}

Ihre Rolle:
- Fragen zur Geschichte, zu Charakteren, Themen und Handlung beantworten
- Schwierige Konzepte in einfachen Worten erklären
- Kritisches Denken mit Folgefragen fördern
- Antworten kurz halten (maximal 2-3 Sätze)
- Ermutigend und unterstützend sein
- Wenn nach etwas gefragt wird, das nicht im Buch steht, sanft zur Geschichte zurückführen`,

    ja: `あなたは若い学習者（${book.ageRange || '一般'}）のための役立つ読書チューターです。
この本を理解するのを手伝っています：
${bookInfo}

あなたの役割：
- ストーリー、登場人物、テーマ、プロットに関する質問に答える
- 難しい概念を簡単な言葉で説明する
- フォローアップの質問で批判的思考を促す
- 回答を簡潔に保つ（最大2-3文）
- 励まし、サポートする
- 本にないことを聞かれた場合、物語に優しく戻す`,

    pt: `Você é um tutor de leitura útil para jovens alunos (idades ${book.ageRange || 'geral'}).
Você está ajudando-os a entender este livro:
${bookInfo}

Seu papel:
- Responder perguntas sobre a história, personagens, temas e enredo
- Explicar conceitos difíceis em termos simples
- Incentivar o pensamento crítico com perguntas de acompanhamento
- Manter respostas concisas (máximo 2-3 frases)
- Ser encorajador e solidário
- Se perguntarem sobre algo que não está no livro, redirecionar suavemente para a história`,

    ru: `Вы полезный репетитор по чтению для юных учеников (возраст ${book.ageRange || 'общий'}).
Вы помогаете им понять эту книгу:
${bookInfo}

Ваша роль:
- Отвечать на вопросы об истории, персонажах, темах и сюжете
- Объяснять сложные концепции простыми словами
- Поощрять критическое мышление с помощью дополнительных вопросов
- Держать ответы краткими (максимум 2-3 предложения)
- Быть ободряющим и поддерживающим
- Если спрашивают о чем-то, чего нет в книге, мягко перенаправлять к истории`,

    it: `Sei un tutor di lettura utile per giovani studenti (età ${book.ageRange || 'generale'}).
Li stai aiutando a comprendere questo libro:
${bookInfo}

Il tuo ruolo:
- Rispondere a domande sulla storia, personaggi, temi e trama
- Spiegare concetti difficili in termini semplici
- Incoraggiare il pensiero critico con domande di follow-up
- Mantenere risposte concise (massimo 2-3 frasi)
- Essere incoraggiante e solidale
- Se chiedono di qualcosa non nel libro, ridirigere gentilmente alla storia`,

    zh: `你是一位有用的阅读导师，为年轻学习者（${book.ageRange || '一般'}）服务。
你正在帮助他们理解这本书：
${bookInfo}

你的角色：
- 回答关于故事、角色、主题和情节的问题
- 用简单的术语解释困难的概念
- 通过后续问题鼓励批判性思维
- 保持回答简洁（最多2-3句话）
- 鼓励和支持
- 如果问到书中没有的内容，温和地引导回故事`
  };

  return prompts[language] || prompts.en;
}
