import { SupportedLanguage } from '@/lib/i18n/language-cookie';

export interface GrammarPrompts {
  system: string;
  user: (content: string) => string;
  errorFallback: string;
}

export interface StructurePrompts {
  system: string;
  user: (content: string) => string;
  errorFallback: string;
}

export interface WritingHelpPrompts {
  system: string;
  user: (content: string, question: string) => string;
  errorFallback: string;
}

export interface ReviewPrompts {
  GRAMMAR: string;
  STRUCTURE: string;
  WRITING_HELP: string;
}

export interface LanguagePrompts {
  grammar: GrammarPrompts;
  structure: StructurePrompts;
  writingHelp: WritingHelpPrompts;
  review: ReviewPrompts;
}

export const PROMPTS: Record<SupportedLanguage, LanguagePrompts> = {
  en: {
    grammar: {
      system: 'You are a kind teacher helping children with writing. Find grammar errors and explain them in simple words. Return results in JSON format: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `Please check the grammar of this text:\n\n${content}`,
      errorFallback: 'AI grammar check failed. Please try again later.'
    },
    structure: {
      system: 'You are a writing teacher helping children improve their story structure. Analyze the story structure and provide constructive feedback. Return results in JSON format: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `Please analyze the structure of this story:\n\n${content}`,
      errorFallback: 'AI structure analysis failed. Please try again later.'
    },
    writingHelp: {
      system: 'You are a friendly writing assistant helping children with their stories. Answer questions clearly and encourage creativity.',
      user: (content, question) => `Story context:\n${content}\n\nQuestion: ${question}`,
      errorFallback: 'AI writing help failed. Please try again later.'
    },
    review: {
      GRAMMAR: `Analyze the following story for grammar, spelling, and punctuation issues. Provide specific, actionable feedback that a young writer can understand and apply. Focus on the most important issues first.

Format your response as JSON:
{
  "grammarIssues": [{"line": number, "issue": "description", "suggestion": "fix"}],
  "grammarScore": 0-100,
  "suggestions": ["general tip 1", "general tip 2"]
}`,
      STRUCTURE: `Analyze the following story's structure, including beginning, middle, end, character development, and plot coherence. Provide constructive feedback that helps young writers improve their storytelling.

CRITICAL: For improvements, you MUST include the exact sentence from the story that needs improvement, plus your suggestion.

Format your response as JSON:
{
  "structureAnalysis": "overall analysis",
  "strengths": ["strength 1", "strength 2"],
  "improvements": [
    {"text": "exact sentence from the story that needs work", "suggestion": "how to improve this specific sentence"},
    {"text": "another exact sentence", "suggestion": "another specific improvement"}
  ],
  "structureScore": 0-100
}

Example:
{
  "structureAnalysis": "The story has a clear beginning but rushes through the middle section.",
  "strengths": ["Strong opening that hooks the reader", "Vivid character descriptions"],
  "improvements": [
    {"text": "Then everything happened very fast.", "suggestion": "Expand this moment - describe what happened step by step to build tension."},
    {"text": "The hero won.", "suggestion": "Show how the hero won instead of just telling us - what actions did they take?"}
  ],
  "structureScore": 75
}`,
      WRITING_HELP: `Provide constructive feedback and encouragement for this story. Highlight what works well and offer specific suggestions for improvement. Keep your tone positive and supportive.

CRITICAL: For suggestions, you MUST include the exact sentence from the story that could be improved, plus your suggestion.

Format your response as JSON:
{
  "feedback": "main feedback",
  "strengths": ["strength 1", "strength 2"],
  "suggestions": [
    {"text": "exact sentence from the story", "suggestion": "how to make it even better"},
    {"text": "another exact sentence", "suggestion": "another way to enhance it"}
  ],
  "encouragement": "positive message"
}

Example:
{
  "feedback": "You've created an imaginative world with interesting characters!",
  "strengths": ["Creative setting", "Good dialogue"],
  "suggestions": [
    {"text": "The dragon was big.", "suggestion": "Try describing exactly how big - was it as tall as a house? Did its wings block out the sun?"},
    {"text": "She felt scared.", "suggestion": "Show us she's scared through her actions - maybe her hands trembled or her voice shook?"}
  ],
  "encouragement": "Keep writing - your storytelling is getting stronger with each story!"
}`
    }
  },

  ko: {
    grammar: {
      system: '당신은 어린이 글쓰기를 도와주는 친절한 선생님입니다. 문법 오류를 찾고 쉬운 말로 설명해주세요. 결과는 JSON 형식으로 반환: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `다음 글의 문법을 검토해주세요:\n\n${content}`,
      errorFallback: 'AI 문법 검사에 실패했습니다. 나중에 다시 시도해주세요.'
    },
    structure: {
      system: '당신은 어린이의 이야기 구조를 개선하도록 돕는 글쓰기 선생님입니다. 이야기 구조를 분석하고 건설적인 피드백을 제공하세요. 결과는 JSON 형식으로 반환: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `다음 이야기의 구조를 분석해주세요:\n\n${content}`,
      errorFallback: 'AI 구조 분석에 실패했습니다. 나중에 다시 시도해주세요.'
    },
    writingHelp: {
      system: '당신은 어린이의 이야기를 돕는 친절한 글쓰기 도우미입니다. 질문에 명확하게 답하고 창의성을 격려해주세요.',
      user: (content, question) => `이야기 내용:\n${content}\n\n질문: ${question}`,
      errorFallback: 'AI 글쓰기 도움에 실패했습니다. 나중에 다시 시도해주세요.'
    },
    review: {
      GRAMMAR: `다음 이야기의 문법, 맞춤법, 구두점 문제를 분석해주세요. 어린 작가가 이해하고 적용할 수 있는 구체적이고 실행 가능한 피드백을 제공하세요. 가장 중요한 문제에 먼저 집중하세요.

응답을 JSON 형식으로 작성:
{
  "grammarIssues": [{"line": 번호, "issue": "설명", "suggestion": "수정안"}],
  "grammarScore": 0-100,
  "suggestions": ["일반 팁 1", "일반 팁 2"]
}`,
      STRUCTURE: `다음 이야기의 구조를 분석해주세요. 시작, 중간, 끝, 캐릭터 발전, 플롯 일관성을 포함합니다. 어린 작가들이 스토리텔링을 개선하는 데 도움이 되는 건설적인 피드백을 제공하세요.

중요: improvements에는 반드시 이야기에서 개선이 필요한 정확한 문장과 개선 제안을 함께 포함해야 합니다. 필드명은 영어로 유지하세요(text, suggestion).

응답을 JSON 형식으로 작성:
{
  "structureAnalysis": "전체 분석",
  "strengths": ["강점 1", "강점 2"],
  "improvements": [
    {"text": "이야기에서 개선이 필요한 정확한 문장", "suggestion": "이 문장을 개선하는 방법"},
    {"text": "또 다른 정확한 문장", "suggestion": "또 다른 구체적인 개선 방법"}
  ],
  "structureScore": 0-100
}

예시:
{
  "structureAnalysis": "이야기는 명확한 시작이 있지만 중간 부분이 급하게 진행됩니다.",
  "strengths": ["독자의 관심을 끄는 강력한 오프닝", "생생한 캐릭터 묘사"],
  "improvements": [
    {"text": "그리고 모든 일이 매우 빠르게 일어났습니다.", "suggestion": "이 순간을 확장하세요 - 긴장감을 조성하기 위해 무슨 일이 일어났는지 단계별로 설명하세요."},
    {"text": "주인공이 이겼습니다.", "suggestion": "주인공이 어떻게 이겼는지 보여주세요 - 어떤 행동을 취했나요?"}
  ],
  "structureScore": 75
}`,
      WRITING_HELP: `이 이야기에 대한 건설적인 피드백과 격려를 제공하세요. 잘된 부분을 강조하고 개선을 위한 구체적인 제안을 제공하세요. 긍정적이고 지지하는 톤을 유지하세요.

중요: suggestions에는 반드시 이야기에서 개선할 수 있는 정확한 문장과 개선 제안을 함께 포함해야 합니다. 필드명은 영어로 유지하세요(text, suggestion).

응답을 JSON 형식으로 작성:
{
  "feedback": "주요 피드백",
  "strengths": ["강점 1", "강점 2"],
  "suggestions": [
    {"text": "이야기에서 가져온 정확한 문장", "suggestion": "이를 더 좋게 만드는 방법"},
    {"text": "또 다른 정확한 문장", "suggestion": "이를 향상시키는 또 다른 방법"}
  ],
  "encouragement": "긍정적인 메시지"
}

예시:
{
  "feedback": "흥미로운 캐릭터들과 상상력 넘치는 세계를 만들었어요!",
  "strengths": ["창의적인 배경", "좋은 대화"],
  "suggestions": [
    {"text": "용은 컸습니다.", "suggestion": "정확히 얼마나 큰지 설명해보세요 - 집만큼 컸나요? 날개가 태양을 가렸나요?"},
    {"text": "그녀는 무서웠습니다.", "suggestion": "그녀가 무서워하는 모습을 행동으로 보여주세요 - 손이 떨렸나요? 목소리가 떨렸나요?"}
  ],
  "encouragement": "계속 글을 쓰세요 - 이야기마다 당신의 스토리텔링이 더 강해지고 있어요!"
}`
    }
  },

  es: {
    grammar: {
      system: 'Eres un maestro amable que ayuda a los niños a escribir. Encuentra errores gramaticales y explícalos con palabras simples. Devuelve resultados en formato JSON: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `Por favor revisa la gramática de este texto:\n\n${content}`,
      errorFallback: 'La verificación gramatical de IA falló. Por favor, inténtalo de nuevo más tarde.'
    },
    structure: {
      system: 'Eres un maestro de escritura que ayuda a los niños a mejorar la estructura de sus historias. Analiza la estructura de la historia y proporciona comentarios constructivos. Devuelve resultados en formato JSON: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `Por favor analiza la estructura de esta historia:\n\n${content}`,
      errorFallback: 'El análisis de estructura de IA falló. Por favor, inténtalo de nuevo más tarde.'
    },
    writingHelp: {
      system: 'Eres un asistente de escritura amigable que ayuda a los niños con sus historias. Responde preguntas claramente y fomenta la creatividad.',
      user: (content, question) => `Contexto de la historia:\n${content}\n\nPregunta: ${question}`,
      errorFallback: 'La ayuda de escritura de IA falló. Por favor, inténtalo de nuevo más tarde.'
    },
    review: {
      GRAMMAR: `Analiza la siguiente historia en busca de problemas de gramática, ortografía y puntuación. Proporciona comentarios específicos y prácticos que un escritor joven pueda entender y aplicar. Concéntrate primero en los problemas más importantes.

Formato de respuesta JSON:
{
  "grammarIssues": [{"line": número, "issue": "descripción", "suggestion": "corrección"}],
  "grammarScore": 0-100,
  "suggestions": ["consejo general 1", "consejo general 2"]
}`,
      STRUCTURE: `Analiza la estructura de la siguiente historia, incluyendo inicio, medio, final, desarrollo de personajes y coherencia de la trama. Proporciona comentarios constructivos que ayuden a los jóvenes escritores a mejorar su narración.

CRÍTICO: Para improvements, DEBES incluir la oración exacta de la historia que necesita mejora, más tu sugerencia. Mantén los nombres de campos en inglés (text, suggestion).

Formato de respuesta JSON:
{
  "structureAnalysis": "análisis general",
  "strengths": ["fortaleza 1", "fortaleza 2"],
  "improvements": [
    {"text": "oración exacta de la historia", "suggestion": "cómo mejorar esta oración"},
    {"text": "otra oración exacta", "suggestion": "otra mejora específica"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `Proporciona comentarios constructivos y aliento para esta historia. Destaca lo que funciona bien y ofrece sugerencias específicas para mejorar. Mantén un tono positivo y de apoyo.

CRÍTICO: Para suggestions, DEBES incluir la oración exacta de la historia, más tu sugerencia. Mantén los nombres de campos en inglés (text, suggestion).

Formato de respuesta JSON:
{
  "feedback": "comentario principal",
  "strengths": ["fortaleza 1", "fortaleza 2"],
  "suggestions": [
    {"text": "oración exacta de la historia", "suggestion": "cómo mejorarla"},
    {"text": "otra oración exacta", "suggestion": "otra mejora"}
  ],
  "encouragement": "mensaje positivo"
}`
    }
  },

  ar: {
    grammar: {
      system: 'أنت معلم لطيف يساعد الأطفال في الكتابة. ابحث عن الأخطاء النحوية واشرحها بكلمات بسيطة. أرجع النتائج بتنسيق JSON: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `الرجاء التحقق من قواعد هذا النص:\n\n${content}`,
      errorFallback: 'فشل فحص القواعد بواسطة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقًا.'
    },
    structure: {
      system: 'أنت معلم كتابة يساعد الأطفال على تحسين بنية قصصهم. قم بتحليل بنية القصة وتقديم ملاحظات بناءة. أرجع النتائج بتنسيق JSON: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `الرجاء تحليل بنية هذه القصة:\n\n${content}`,
      errorFallback: 'فشل تحليل البنية بواسطة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقًا.'
    },
    writingHelp: {
      system: 'أنت مساعد كتابة ودود يساعد الأطفال في قصصهم. أجب على الأسئلة بوضوح وشجع الإبداع.',
      user: (content, question) => `سياق القصة:\n${content}\n\nالسؤال: ${question}`,
      errorFallback: 'فشلت مساعدة الكتابة بواسطة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقًا.'
    },
    review: {
      GRAMMAR: `قم بتحليل القصة التالية بحثًا عن مشاكل في القواعد والإملاء وعلامات الترقيم. قدم ملاحظات محددة وقابلة للتنفيذ يمكن للكاتب الصغير فهمها وتطبيقها. ركز أولاً على المشكلات الأكثر أهمية.

تنسيق الاستجابة JSON:
{
  "grammarIssues": [{"line": رقم, "issue": "وصف", "suggestion": "إصلاح"}],
  "grammarScore": 0-100,
  "suggestions": ["نصيحة عامة 1", "نصيحة عامة 2"]
}`,
      STRUCTURE: `قم بتحليل بنية القصة التالية، بما في ذلك البداية والوسط والنهاية وتطوير الشخصية وتماسك الحبكة. قدم ملاحظات بناءة تساعد الكتاب الصغار على تحسين سردهم للقصص.

مهم: يجب أن تتضمن improvements الجملة الدقيقة من القصة التي تحتاج إلى تحسين، بالإضافة إلى اقتراحك. احتفظ بأسماء الحقول باللغة الإنجليزية (text, suggestion).

تنسيق الاستجابة JSON:
{
  "structureAnalysis": "تحليل شامل",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": [
    {"text": "الجملة الدقيقة من القصة", "suggestion": "كيفية تحسين هذه الجملة"},
    {"text": "جملة دقيقة أخرى", "suggestion": "تحسين محدد آخر"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `قدم ملاحظات بناءة وتشجيع لهذه القصة. سلط الضوء على ما ينجح جيدًا وقدم اقتراحات محددة للتحسين. حافظ على نبرة إيجابية وداعمة.

مهم: يجب أن تتضمن suggestions الجملة الدقيقة من القصة، بالإضافة إلى اقتراحك. احتفظ بأسماء الحقول باللغة الإنجليزية (text, suggestion).

تنسيق الاستجابة JSON:
{
  "feedback": "الملاحظات الرئيسية",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "suggestions": [
    {"text": "الجملة الدقيقة من القصة", "suggestion": "كيفية تحسينها"},
    {"text": "جملة دقيقة أخرى", "suggestion": "تحسين آخر"}
  ],
  "encouragement": "رسالة إيجابية"
}`
    }
  },

  hi: {
    grammar: {
      system: 'आप एक दयालु शिक्षक हैं जो बच्चों को लिखने में मदद करते हैं। व्याकरण की त्रुटियां खोजें और उन्हें सरल शब्दों में समझाएं। परिणाम JSON प्रारूप में लौटाएं: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `कृपया इस पाठ के व्याकरण की जांच करें:\n\n${content}`,
      errorFallback: 'AI व्याकरण जांच विफल रही। कृपया बाद में पुनः प्रयास करें।'
    },
    structure: {
      system: 'आप एक लेखन शिक्षक हैं जो बच्चों को उनकी कहानी की संरचना सुधारने में मदद करते हैं। कहानी की संरचना का विश्लेषण करें और रचनात्मक प्रतिक्रिया प्रदान करें। परिणाम JSON प्रारूप में लौटाएं: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `कृपया इस कहानी की संरचना का विश्लेषण करें:\n\n${content}`,
      errorFallback: 'AI संरचना विश्लेषण विफल रहा। कृपया बाद में पुनः प्रयास करें।'
    },
    writingHelp: {
      system: 'आप एक मित्रवत लेखन सहायक हैं जो बच्चों को उनकी कहानियों में मदद करते हैं। प्रश्नों का स्पष्ट उत्तर दें और रचनात्मकता को प्रोत्साहित करें।',
      user: (content, question) => `कहानी का संदर्भ:\n${content}\n\nप्रश्न: ${question}`,
      errorFallback: 'AI लेखन सहायता विफल रही। कृपया बाद में पुनः प्रयास करें।'
    },
    review: {
      GRAMMAR: `निम्नलिखित कहानी में व्याकरण, वर्तनी और विराम चिह्न की समस्याओं का विश्लेषण करें। विशिष्ट, कार्रवाई योग्य प्रतिक्रिया प्रदान करें जिसे एक युवा लेखक समझ और लागू कर सके। पहले सबसे महत्वपूर्ण मुद्दों पर ध्यान दें।

JSON प्रारूप में प्रतिक्रिया:
{
  "grammarIssues": [{"line": संख्या, "issue": "विवरण", "suggestion": "सुधार"}],
  "grammarScore": 0-100,
  "suggestions": ["सामान्य सुझाव 1", "सामान्य सुझाव 2"]
}`,
      STRUCTURE: `निम्नलिखित कहानी की संरचना का विश्लेषण करें, जिसमें शुरुआत, मध्य, अंत, चरित्र विकास और कथानक सुसंगतता शामिल है। रचनात्मक प्रतिक्रिया प्रदान करें जो युवा लेखकों को उनकी कहानी कहने में सुधार करने में मदद करे।

महत्वपूर्ण: improvements में कहानी से सटीक वाक्य और आपका सुझाव शामिल होना चाहिए। फ़ील्ड नाम अंग्रेज़ी में रखें (text, suggestion).

JSON प्रारूप में प्रतिक्रिया:
{
  "structureAnalysis": "समग्र विश्लेषण",
  "strengths": ["ताकत 1", "ताकत 2"],
  "improvements": [
    {"text": "कहानी से सटीक वाक्य", "suggestion": "इस वाक्य को कैसे सुधारें"},
    {"text": "एक और सटीक वाक्य", "suggestion": "एक और विशिष्ट सुधार"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `इस कहानी के लिए रचनात्मक प्रतिक्रिया और प्रोत्साहन प्रदान करें। जो अच्छा काम करता है उसे उजागर करें और सुधार के लिए विशिष्ट सुझाव दें। सकारात्मक और सहायक स्वर बनाए रखें।

महत्वपूर्ण: suggestions में कहानी से सटीक वाक्य और आपका सुझाव शामिल होना चाहिए। फ़ील्ड नाम अंग्रेज़ी में रखें (text, suggestion).

JSON प्रारूप में प्रतिक्रिया:
{
  "feedback": "मुख्य प्रतिक्रिया",
  "strengths": ["ताकत 1", "ताकत 2"],
  "suggestions": [
    {"text": "कहानी से सटीक वाक्य", "suggestion": "इसे कैसे बेहतर बनाएं"},
    {"text": "एक और सटीक वाक्य", "suggestion": "एक और सुधार"}
  ],
  "encouragement": "सकारात्मक संदेश"
}`
    }
  },

  fr: {
    grammar: {
      system: 'Vous êtes un professeur bienveillant qui aide les enfants à écrire. Trouvez les erreurs de grammaire et expliquez-les avec des mots simples. Renvoyez les résultats au format JSON: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `Veuillez vérifier la grammaire de ce texte:\n\n${content}`,
      errorFallback: 'La vérification grammaticale IA a échoué. Veuillez réessayer plus tard.'
    },
    structure: {
      system: 'Vous êtes un professeur d\'écriture qui aide les enfants à améliorer la structure de leurs histoires. Analysez la structure de l\'histoire et fournissez des commentaires constructifs. Renvoyez les résultats au format JSON: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `Veuillez analyser la structure de cette histoire:\n\n${content}`,
      errorFallback: 'L\'analyse de structure IA a échoué. Veuillez réessayer plus tard.'
    },
    writingHelp: {
      system: 'Vous êtes un assistant d\'écriture amical qui aide les enfants avec leurs histoires. Répondez clairement aux questions et encouragez la créativité.',
      user: (content, question) => `Contexte de l\'histoire:\n${content}\n\nQuestion: ${question}`,
      errorFallback: 'L\'aide à l\'écriture IA a échoué. Veuillez réessayer plus tard.'
    },
    review: {
      GRAMMAR: `Analysez l'histoire suivante pour les problèmes de grammaire, d'orthographe et de ponctuation. Fournissez des commentaires spécifiques et exploitables qu'un jeune écrivain peut comprendre et appliquer. Concentrez-vous d'abord sur les problèmes les plus importants.

Format de réponse JSON:
{
  "grammarIssues": [{"line": numéro, "issue": "description", "suggestion": "correction"}],
  "grammarScore": 0-100,
  "suggestions": ["conseil général 1", "conseil général 2"]
}`,
      STRUCTURE: `Analysez la structure de l'histoire suivante, y compris le début, le milieu, la fin, le développement des personnages et la cohérence de l'intrigue. Fournissez des commentaires constructifs qui aident les jeunes écrivains à améliorer leur narration.

CRITIQUE: Pour improvements, vous DEVEZ inclure la phrase exacte de l'histoire et votre suggestion. Gardez les noms de champs en anglais (text, suggestion).

Format de réponse JSON:
{
  "structureAnalysis": "analyse globale",
  "strengths": ["force 1", "force 2"],
  "improvements": [
    {"text": "phrase exacte de l'histoire", "suggestion": "comment l'améliorer"},
    {"text": "autre phrase exacte", "suggestion": "autre amélioration"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `Fournissez des commentaires constructifs et des encouragements pour cette histoire. Mettez en évidence ce qui fonctionne bien et offrez des suggestions spécifiques d'amélioration. Maintenez un ton positif et encourageant.

CRITIQUE: Pour suggestions, vous DEVEZ inclure la phrase exacte de l'histoire et votre suggestion. Gardez les noms de champs en anglais (text, suggestion).

Format de réponse JSON:
{
  "feedback": "commentaire principal",
  "strengths": ["force 1", "force 2"],
  "suggestions": [
    {"text": "phrase exacte de l'histoire", "suggestion": "comment l'améliorer"},
    {"text": "autre phrase exacte", "suggestion": "autre amélioration"}
  ],
  "encouragement": "message positif"
}`
    }
  },

  de: {
    grammar: {
      system: 'Sie sind ein freundlicher Lehrer, der Kindern beim Schreiben hilft. Finden Sie Grammatikfehler und erklären Sie sie mit einfachen Worten. Geben Sie Ergebnisse im JSON-Format zurück: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `Bitte überprüfen Sie die Grammatik dieses Textes:\n\n${content}`,
      errorFallback: 'KI-Grammatikprüfung fehlgeschlagen. Bitte versuchen Sie es später erneut.'
    },
    structure: {
      system: 'Sie sind ein Schreiblehrer, der Kindern hilft, die Struktur ihrer Geschichten zu verbessern. Analysieren Sie die Geschichtsstruktur und geben Sie konstruktives Feedback. Geben Sie Ergebnisse im JSON-Format zurück: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `Bitte analysieren Sie die Struktur dieser Geschichte:\n\n${content}`,
      errorFallback: 'KI-Strukturanalyse fehlgeschlagen. Bitte versuchen Sie es später erneut.'
    },
    writingHelp: {
      system: 'Sie sind ein freundlicher Schreibassistent, der Kindern bei ihren Geschichten hilft. Beantworten Sie Fragen klar und fördern Sie die Kreativität.',
      user: (content, question) => `Geschichtskontext:\n${content}\n\nFrage: ${question}`,
      errorFallback: 'KI-Schreibhilfe fehlgeschlagen. Bitte versuchen Sie es später erneut.'
    },
    review: {
      GRAMMAR: `Analysieren Sie die folgende Geschichte auf Grammatik-, Rechtschreib- und Zeichensetzungsprobleme. Geben Sie spezifisches, umsetzbares Feedback, das ein junger Autor verstehen und anwenden kann. Konzentrieren Sie sich zuerst auf die wichtigsten Probleme.

JSON-Antwortformat:
{
  "grammarIssues": [{"line": Nummer, "issue": "Beschreibung", "suggestion": "Korrektur"}],
  "grammarScore": 0-100,
  "suggestions": ["allgemeiner Tipp 1", "allgemeiner Tipp 2"]
}`,
      STRUCTURE: `Analysieren Sie die Struktur der folgenden Geschichte, einschließlich Anfang, Mitte, Ende, Charakterentwicklung und Handlungskohärenz. Geben Sie konstruktives Feedback, das jungen Autoren hilft, ihr Geschichtenerzählen zu verbessern.

KRITISCH: Für improvements MÜSSEN Sie den exakten Satz aus der Geschichte und Ihren Vorschlag einschließen. Behalten Sie Feldnamen auf Englisch (text, suggestion).

JSON-Antwortformat:
{
  "structureAnalysis": "Gesamtanalyse",
  "strengths": ["Stärke 1", "Stärke 2"],
  "improvements": [
    {"text": "exakter Satz aus der Geschichte", "suggestion": "wie man ihn verbessert"},
    {"text": "ein anderer exakter Satz", "suggestion": "eine andere Verbesserung"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `Geben Sie konstruktives Feedback und Ermutigung für diese Geschichte. Heben Sie hervor, was gut funktioniert, und bieten Sie spezifische Verbesserungsvorschläge. Behalten Sie einen positiven und unterstützenden Ton bei.

KRITISCH: Für suggestions MÜSSEN Sie den exakten Satz aus der Geschichte und Ihren Vorschlag einschließen. Behalten Sie Feldnamen auf Englisch (text, suggestion).

JSON-Antwortformat:
{
  "feedback": "Hauptfeedback",
  "strengths": ["Stärke 1", "Stärke 2"],
  "suggestions": [
    {"text": "exakter Satz aus der Geschichte", "suggestion": "wie man ihn verbessert"},
    {"text": "ein anderer exakter Satz", "suggestion": "eine andere Verbesserung"}
  ],
  "encouragement": "positive Nachricht"
}`
    }
  },

  ja: {
    grammar: {
      system: 'あなたは子供の文章作成を手伝う親切な先生です。文法の誤りを見つけ、簡単な言葉で説明してください。結果はJSON形式で返してください: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `このテキストの文法をチェックしてください:\n\n${content}`,
      errorFallback: 'AI文法チェックに失敗しました。後でもう一度お試しください。'
    },
    structure: {
      system: 'あなたは子供たちが物語の構造を改善するのを手伝う作文の先生です。物語の構造を分析し、建設的なフィードバックを提供してください。結果はJSON形式で返してください: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `この物語の構造を分析してください:\n\n${content}`,
      errorFallback: 'AI構造分析に失敗しました。後でもう一度お試しください。'
    },
    writingHelp: {
      system: 'あなたは子供たちの物語を手伝うフレンドリーな執筆アシスタントです。質問に明確に答え、創造性を奨励してください。',
      user: (content, question) => `物語の文脈:\n${content}\n\n質問: ${question}`,
      errorFallback: 'AI執筆ヘルプに失敗しました。後でもう一度お試しください。'
    },
    review: {
      GRAMMAR: `以下の物語の文法、スペル、句読点の問題を分析してください。若い作家が理解して適用できる具体的で実行可能なフィードバックを提供してください。最も重要な問題に最初に焦点を当ててください。

JSON形式の応答:
{
  "grammarIssues": [{"line": 番号, "issue": "説明", "suggestion": "修正"}],
  "grammarScore": 0-100,
  "suggestions": ["一般的なヒント1", "一般的なヒント2"]
}`,
      STRUCTURE: `以下の物語の構造を分析してください。始まり、中間、終わり、キャラクター開発、プロットの一貫性を含みます。若い作家がストーリーテリングを改善するのに役立つ建設的なフィードバックを提供してください。

重要: improvementsには物語から正確な文と提案を含める必要があります。フィールド名は英語のままにしてください (text, suggestion).

JSON形式の応答:
{
  "structureAnalysis": "全体的な分析",
  "strengths": ["強み1", "強み2"],
  "improvements": [
    {"text": "物語から正確な文", "suggestion": "この文を改善する方法"},
    {"text": "別の正確な文", "suggestion": "別の具体的な改善"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `この物語に対して建設的なフィードバックと励ましを提供してください。うまくいっている点を強調し、改善のための具体的な提案を提供してください。ポジティブでサポート的な口調を保ってください。

重要: suggestionsには物語から正確な文と提案を含める必要があります。フィールド名は英語のままにしてください (text, suggestion).

JSON形式の応答:
{
  "feedback": "主なフィードバック",
  "strengths": ["強み1", "強み2"],
  "suggestions": [
    {"text": "物語から正確な文", "suggestion": "それをより良くする方法"},
    {"text": "別の正確な文", "suggestion": "別の改善"}
  ],
  "encouragement": "ポジティブなメッセージ"
}`
    }
  },

  pt: {
    grammar: {
      system: 'Você é um professor gentil que ajuda crianças a escrever. Encontre erros gramaticais e explique-os com palavras simples. Retorne resultados em formato JSON: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `Por favor, verifique a gramática deste texto:\n\n${content}`,
      errorFallback: 'A verificação gramatical de IA falhou. Por favor, tente novamente mais tarde.'
    },
    structure: {
      system: 'Você é um professor de escrita que ajuda crianças a melhorar a estrutura de suas histórias. Analise a estrutura da história e forneça feedback construtivo. Retorne resultados em formato JSON: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `Por favor, analise a estrutura desta história:\n\n${content}`,
      errorFallback: 'A análise de estrutura de IA falhou. Por favor, tente novamente mais tarde.'
    },
    writingHelp: {
      system: 'Você é um assistente de escrita amigável que ajuda crianças com suas histórias. Responda perguntas claramente e incentive a criatividade.',
      user: (content, question) => `Contexto da história:\n${content}\n\nPergunta: ${question}`,
      errorFallback: 'A ajuda de escrita de IA falhou. Por favor, tente novamente mais tarde.'
    },
    review: {
      GRAMMAR: `Analise a seguinte história em busca de problemas de gramática, ortografia e pontuação. Forneça feedback específico e acionável que um jovem escritor possa entender e aplicar. Concentre-se primeiro nos problemas mais importantes.

Formato de resposta JSON:
{
  "grammarIssues": [{"line": número, "issue": "descrição", "suggestion": "correção"}],
  "grammarScore": 0-100,
  "suggestions": ["dica geral 1", "dica geral 2"]
}`,
      STRUCTURE: `Analise a estrutura da seguinte história, incluindo início, meio, fim, desenvolvimento de personagens e coerência do enredo. Forneça feedback construtivo que ajude jovens escritores a melhorar sua narrativa.

CRÍTICO: Para improvements, você DEVE incluir a frase exata da história e sua sugestão. Mantenha os nomes dos campos em inglês (text, suggestion).

Formato de resposta JSON:
{
  "structureAnalysis": "análise geral",
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "improvements": [
    {"text": "frase exata da história", "suggestion": "como melhorá-la"},
    {"text": "outra frase exata", "suggestion": "outra melhoria"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `Forneça feedback construtivo e incentivo para esta história. Destaque o que funciona bem e ofereça sugestões específicas de melhoria. Mantenha um tom positivo e de apoio.

CRÍTICO: Para suggestions, você DEVE incluir a frase exata da história e sua sugestão. Mantenha os nomes dos campos em inglês (text, suggestion).

Formato de resposta JSON:
{
  "feedback": "feedback principal",
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "suggestions": [
    {"text": "frase exata da história", "suggestion": "como melhorá-la"},
    {"text": "outra frase exata", "suggestion": "outra melhoria"}
  ],
  "encouragement": "mensagem positiva"
}`
    }
  },

  ru: {
    grammar: {
      system: 'Вы добрый учитель, который помогает детям писать. Находите грамматические ошибки и объясняйте их простыми словами. Возвращайте результаты в формате JSON: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `Пожалуйста, проверьте грамматику этого текста:\n\n${content}`,
      errorFallback: 'Проверка грамматики ИИ не удалась. Пожалуйста, попробуйте позже.'
    },
    structure: {
      system: 'Вы учитель письма, который помогает детям улучшить структуру своих историй. Проанализируйте структуру истории и дайте конструктивную обратную связь. Возвращайте результаты в формате JSON: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `Пожалуйста, проанализируйте структуру этой истории:\n\n${content}`,
      errorFallback: 'Анализ структуры ИИ не удался. Пожалуйста, попробуйте позже.'
    },
    writingHelp: {
      system: 'Вы дружелюбный помощник по письму, который помогает детям с их историями. Отвечайте на вопросы четко и поощряйте творчество.',
      user: (content, question) => `Контекст истории:\n${content}\n\nВопрос: ${question}`,
      errorFallback: 'Помощь ИИ в написании не удалась. Пожалуйста, попробуйте позже.'
    },
    review: {
      GRAMMAR: `Проанализируйте следующую историю на наличие проблем с грамматикой, орфографией и пунктуацией. Предоставьте конкретную, действенную обратную связь, которую молодой писатель может понять и применить. Сосредоточьтесь сначала на самых важных проблемах.

Формат ответа JSON:
{
  "grammarIssues": [{"line": номер, "issue": "описание", "suggestion": "исправление"}],
  "grammarScore": 0-100,
  "suggestions": ["общий совет 1", "общий совет 2"]
}`,
      STRUCTURE: `Проанализируйте структуру следующей истории, включая начало, середину, конец, развитие персонажей и согласованность сюжета. Предоставьте конструктивную обратную связь, которая поможет молодым писателям улучшить их повествование.

КРИТИЧНО: Для improvements вы ДОЛЖНЫ включить точное предложение из истории и свое предложение. Сохраняйте имена полей на английском (text, suggestion).

Формат ответа JSON:
{
  "structureAnalysis": "общий анализ",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "improvements": [
    {"text": "точное предложение из истории", "suggestion": "как его улучшить"},
    {"text": "другое точное предложение", "suggestion": "другое улучшение"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `Предоставьте конструктивную обратную связь и поддержку для этой истории. Выделите то, что работает хорошо, и предложите конкретные предложения по улучшению. Поддерживайте позитивный и поддерживающий тон.

КРИТИЧНО: Для suggestions вы ДОЛЖНЫ включить точное предложение из истории и свое предложение. Сохраняйте имена полей на английском (text, suggestion).

Формат ответа JSON:
{
  "feedback": "основная обратная связь",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "suggestions": [
    {"text": "точное предложение из истории", "suggestion": "как его улучшить"},
    {"text": "другое точное предложение", "suggestion": "другое улучшение"}
  ],
  "encouragement": "позитивное сообщение"
}`
    }
  },

  it: {
    grammar: {
      system: 'Sei un insegnante gentile che aiuta i bambini a scrivere. Trova gli errori grammaticali e spiegali con parole semplici. Restituisci risultati in formato JSON: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `Per favore controlla la grammatica di questo testo:\n\n${content}`,
      errorFallback: 'Il controllo grammaticale AI è fallito. Per favore riprova più tardi.'
    },
    structure: {
      system: 'Sei un insegnante di scrittura che aiuta i bambini a migliorare la struttura delle loro storie. Analizza la struttura della storia e fornisci feedback costruttivo. Restituisci risultati in formato JSON: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `Per favore analizza la struttura di questa storia:\n\n${content}`,
      errorFallback: 'L\'analisi della struttura AI è fallita. Per favore riprova più tardi.'
    },
    writingHelp: {
      system: 'Sei un assistente di scrittura amichevole che aiuta i bambini con le loro storie. Rispondi alle domande chiaramente e incoraggia la creatività.',
      user: (content, question) => `Contesto della storia:\n${content}\n\nDomanda: ${question}`,
      errorFallback: 'L\'aiuto alla scrittura AI è fallito. Per favore riprova più tardi.'
    },
    review: {
      GRAMMAR: `Analizza la seguente storia per problemi di grammatica, ortografia e punteggiatura. Fornisci feedback specifico e attuabile che un giovane scrittore possa comprendere e applicare. Concentrati prima sui problemi più importanti.

Formato risposta JSON:
{
  "grammarIssues": [{"line": numero, "issue": "descrizione", "suggestion": "correzione"}],
  "grammarScore": 0-100,
  "suggestions": ["suggerimento generale 1", "suggerimento generale 2"]
}`,
      STRUCTURE: `Analizza la struttura della seguente storia, inclusi inizio, metà, fine, sviluppo dei personaggi e coerenza della trama. Fornisci feedback costruttivo che aiuti i giovani scrittori a migliorare la loro narrazione.

CRITICO: Per improvements, DEVI includere la frase esatta dalla storia e il tuo suggerimento. Mantieni i nomi dei campi in inglese (text, suggestion).

Formato risposta JSON:
{
  "structureAnalysis": "analisi complessiva",
  "strengths": ["punto di forza 1", "punto di forza 2"],
  "improvements": [
    {"text": "frase esatta dalla storia", "suggestion": "come migliorarla"},
    {"text": "un'altra frase esatta", "suggestion": "un altro miglioramento"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `Fornisci feedback costruttivo e incoraggiamento per questa storia. Evidenzia ciò che funziona bene e offri suggerimenti specifici per il miglioramento. Mantieni un tono positivo e di supporto.

CRITICO: Per suggestions, DEVI includere la frase esatta dalla storia e il tuo suggerimento. Mantieni i nomi dei campi in inglese (text, suggestion).

Formato risposta JSON:
{
  "feedback": "feedback principale",
  "strengths": ["punto di forza 1", "punto di forza 2"],
  "suggestions": [
    {"text": "frase esatta dalla storia", "suggestion": "come migliorarla"},
    {"text": "un'altra frase esatta", "suggestion": "un altro miglioramento"}
  ],
  "encouragement": "messaggio positivo"
}`
    }
  },

  zh: {
    grammar: {
      system: '您是一位帮助孩子写作的友善老师。找出语法错误并用简单的话解释它们。以JSON格式返回结果: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }',
      user: (content) => `请检查此文本的语法:\n\n${content}`,
      errorFallback: 'AI语法检查失败。请稍后再试。'
    },
    structure: {
      system: '您是一位帮助孩子改进故事结构的写作老师。分析故事结构并提供建设性反馈。以JSON格式返回结果: { "structureAnalysis": string, "strengths": string[], "improvements": string[], "structureScore": 0-100 }',
      user: (content) => `请分析这个故事的结构:\n\n${content}`,
      errorFallback: 'AI结构分析失败。请稍后再试。'
    },
    writingHelp: {
      system: '您是一位友好的写作助手，帮助孩子们写故事。清楚地回答问题并鼓励创造力。',
      user: (content, question) => `故事背景:\n${content}\n\n问题: ${question}`,
      errorFallback: 'AI写作帮助失败。请稍后再试。'
    },
    review: {
      GRAMMAR: `分析以下故事的语法、拼写和标点问题。提供年轻作家可以理解和应用的具体、可操作的反馈。首先关注最重要的问题。

JSON响应格式:
{
  "grammarIssues": [{"line": 行号, "issue": "描述", "suggestion": "修正"}],
  "grammarScore": 0-100,
  "suggestions": ["一般提示1", "一般提示2"]
}`,
      STRUCTURE: `分析以下故事的结构，包括开头、中间、结尾、人物发展和情节连贯性。提供有助于年轻作家改进叙事的建设性反馈。

重要: 对于improvements，您必须包含故事中的确切句子和您的建议。保持字段名称为英文(text, suggestion)。

JSON响应格式:
{
  "structureAnalysis": "整体分析",
  "strengths": ["优点1", "优点2"],
  "improvements": [
    {"text": "故事中的确切句子", "suggestion": "如何改进"},
    {"text": "另一个确切句子", "suggestion": "另一个改进"}
  ],
  "structureScore": 0-100
}`,
      WRITING_HELP: `为这个故事提供建设性反馈和鼓励。突出好的方面并提供具体的改进建议。保持积极和支持的语气。

重要: 对于suggestions，您必须包含故事中的确切句子和您的建议。保持字段名称为英文(text, suggestion)。

JSON响应格式:
{
  "feedback": "主要反馈",
  "strengths": ["优点1", "优点2"],
  "suggestions": [
    {"text": "故事中的确切句子", "suggestion": "如何改进"},
    {"text": "另一个确切句子", "suggestion": "另一个改进"}
  ],
  "encouragement": "积极信息"
}`
    }
  }
};

export function getPrompts(language?: SupportedLanguage): LanguagePrompts {
  if (!language || !PROMPTS[language]) {
    return PROMPTS.en;
  }
  return PROMPTS[language];
}
