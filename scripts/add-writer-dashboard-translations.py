#!/usr/bin/env python3
import csv

input_file = '/Users/jihunkong/1001project/1001-stories/locales/translations.csv'
output_file = '/Users/jihunkong/1001project/1001-stories/locales/translations.csv'

# Writer Dashboard translation keys
writer_dashboard_translations = [
    # Empty states
    ["stories.empty.noStories", "Empty state", "No stories yet", "아직 스토리가 없습니다", "Aún no hay historias", "لا توجد قصص بعد", "अभी कोई कहानियाँ नहीं हैं", "Pas encore d'histoires", "Noch keine Geschichten", "まだストーリーはありません", "Ainda não há histórias", "Пока нет историй", "Ancora nessuna storia", "还没有故事"],
    ["stories.empty.allStories", "Empty state", "No stories found", "스토리를 찾을 수 없습니다", "No se encontraron historias", "لم يتم العثور على قصص", "कोई कहानियाँ नहीं मिलीं", "Aucune histoire trouvée", "Keine Geschichten gefunden", "ストーリーが見つかりません", "Nenhuma história encontrada", "Истории не найдены", "Nessuna storia trovata", "未找到故事"],

    # Action buttons
    ["actions.writeNewStory", "Action button", "Write New Story", "새 스토리 작성", "Escribir nueva historia", "اكتب قصة جديدة", "नई कहानी लिखें", "Écrire une nouvelle histoire", "Neue Geschichte schreiben", "新しいストーリーを書く", "Escrever nova história", "Написать новую историю", "Scrivi una nuova storia", "写新故事"],
    ["actions.viewDetails", "Action button", "View Details", "세부정보 보기", "Ver detalles", "عرض التفاصيل", "विवरण देखें", "Voir les détails", "Details anzeigen", "詳細を表示", "Ver detalhes", "Посмотреть детали", "Visualizza dettagli", "查看详情"],
    ["actions.withdraw", "Action button", "Withdraw", "철회", "Retirar", "سحب", "वापस लें", "Retirer", "Zurückziehen", "取り下げ", "Retirar", "Отозвать", "Ritira", "撤回"],
    ["actions.resubmit", "Action button", "Resubmit", "다시 제출", "Reenviar", "إعادة الإرسال", "पुनः सबमिट करें", "Soumettre à nouveau", "Erneut einreichen", "再送信", "Reenviar", "Отправить заново", "Reinvia", "重新提交"],

    # Form fields and labels
    ["form.storyTitle", "Form label", "Story Title", "스토리 제목", "Título de la historia", "عنوان القصة", "कहानी का शीर्षक", "Titre de l'histoire", "Geschichtstitel", "ストーリータイトル", "Título da história", "Название истории", "Titolo della storia", "故事标题"],
    ["form.storyContent", "Form label", "Story Content", "스토리 내용", "Contenido de la historia", "محتوى القصة", "कहानी की सामग्री", "Contenu de l'histoire", "Geschichtsinhalt", "ストーリーコンテンツ", "Conteúdo da história", "Содержание истории", "Contenuto della storia", "故事内容"],
    ["form.characterCount", "Form label", "Character count", "문자 수", "Recuento de caracteres", "عدد الأحرف", "वर्ण गणना", "Nombre de caractères", "Zeichenzahl", "文字数", "Contagem de caracteres", "Количество символов", "Conteggio caratteri", "字符计数"],
    ["form.saveDraft", "Form action", "Save as Draft", "초안으로 저장", "Guardar como borrador", "حفظ كمسودة", "ड्राफ्ट के रूप में सहेजें", "Enregistrer comme brouillon", "Als Entwurf speichern", "下書きとして保存", "Salvar como rascunho", "Сохранить как черновик", "Salva come bozza", "保存为草稿"],
    ["form.submitForReview", "Form action", "Submit for Review", "검토를 위해 제출", "Enviar para revisión", "إرسال للمراجعة", "समीक्षा के लिए सबमिट करें", "Soumettre pour examen", "Zur Überprüfung einreichen", "レビューのために提出", "Enviar para revisão", "Отправить на проверку", "Invia per revisione", "提交审核"],

    # Status descriptions
    ["status.description.draft", "Status description", "Your story is saved as a draft", "스토리가 초안으로 저장되었습니다", "Tu historia está guardada como borrador", "تم حفظ قصتك كمسودة", "आपकी कहानी ड्राफ्ट के रूप में सहेजी गई है", "Votre histoire est enregistrée en tant que brouillon", "Ihre Geschichte ist als Entwurf gespeichert", "あなたのストーリーは下書きとして保存されています", "Sua história foi salva como rascunho", "Ваша история сохранена как черновик", "La tua storia è salvata come bozza", "您的故事已保存为草稿"],
    ["status.description.pending", "Status description", "Your story is awaiting review", "스토리가 검토 대기 중입니다", "Tu historia está esperando revisión", "قصتك في انتظار المراجعة", "आपकी कहानी समीक्षा की प्रतीक्षा में है", "Votre histoire attend d'être examinée", "Ihre Geschichte wartet auf Überprüfung", "あなたのストーリーはレビュー待ちです", "Sua história está aguardando revisão", "Ваша история ожидает проверки", "La tua storia è in attesa di revisione", "您的故事正在等待审核"],
    ["status.description.inReview", "Status description", "Your story is being reviewed", "스토리가 검토 중입니다", "Tu historia está siendo revisada", "قصتك قيد المراجعة", "आपकी कहानी की समीक्षा की जा रही है", "Votre histoire est en cours d'examen", "Ihre Geschichte wird überprüft", "あなたのストーリーはレビュー中です", "Sua história está sendo revisada", "Ваша история проверяется", "La tua storia è in fase di revisione", "您的故事正在审核中"],
    ["status.description.needsRevision", "Status description", "Your story needs revision", "스토리 수정이 필요합니다", "Tu historia necesita revisión", "قصتك تحتاج إلى مراجعة", "आपकी कहानी में संशोधन की आवश्यकता है", "Votre histoire nécessite une révision", "Ihre Geschichte muss überarbeitet werden", "あなたのストーリーは修正が必要です", "Sua história precisa de revisão", "Вашей истории требуется доработка", "La tua storia necessita di revisione", "您的故事需要修订"],
    ["status.description.approved", "Status description", "Your story has been approved", "스토리가 승인되었습니다", "Tu historia ha sido aprobada", "تمت الموافقة على قصتك", "आपकी कहानी स्वीकृत हो गई है", "Votre histoire a été approuvée", "Ihre Geschichte wurde genehmigt", "あなたのストーリーが承認されました", "Sua história foi aprovada", "Ваша история одобрена", "La tua storia è stata approvata", "您的故事已获批准"],
    ["status.description.published", "Status description", "Your story is now published", "스토리가 출판되었습니다", "Tu historia está ahora publicada", "قصتك منشورة الآن", "आपकी कहानी अब प्रकाशित हो गई है", "Votre histoire est maintenant publiée", "Ihre Geschichte ist jetzt veröffentlicht", "あなたのストーリーが公開されました", "Sua história está publicada", "Ваша история опубликована", "La tua storia è ora pubblicata", "您的故事已发布"],
    ["status.description.rejected", "Status description", "Your story was not approved", "스토리가 승인되지 않았습니다", "Tu historia no fue aprobada", "لم تتم الموافقة على قصتك", "आपकी कहानी स्वीकृत नहीं की गई", "Votre histoire n'a pas été approuvée", "Ihre Geschichte wurde nicht genehmigt", "あなたのストーリーは承認されませんでした", "Sua história não foi aprovada", "Ваша история не одобрена", "La tua storia non è stata approvata", "您的故事未获批准"],

    # Dashboard statistics
    ["dashboard.writer.stats.totalWords", "Statistics", "Total Words", "총 단어 수", "Palabras totales", "إجمالي الكلمات", "कुल शब्द", "Nombre total de mots", "Gesamtwörter", "総単語数", "Total de palavras", "Всего слов", "Parole totali", "总字数"],
    ["dashboard.writer.stats.avgReadTime", "Statistics", "Avg. Read Time", "평균 읽기 시간", "Tiempo promedio de lectura", "متوسط وقت القراءة", "औसत पठन समय", "Temps de lecture moyen", "Durchschn. Lesezeit", "平均読み時間", "Tempo médio de leitura", "Среднее время чтения", "Tempo medio di lettura", "平均阅读时间"],
    ["dashboard.writer.stats.completionRate", "Statistics", "Completion Rate", "완료율", "Tasa de finalización", "معدل الإكمال", "पूर्णता दर", "Taux d'achèvement", "Fertigstellungsrate", "完了率", "Taxa de conclusão", "Уровень завершения", "Tasso di completamento", "完成率"],

    # Timeline and tracking
    ["timeline.submitted", "Timeline event", "Submitted", "제출됨", "Enviado", "مُرسَل", "सबमिट किया गया", "Soumis", "Eingereicht", "提出済み", "Enviado", "Отправлено", "Inviato", "已提交"],
    ["timeline.underReview", "Timeline event", "Under Review", "검토 중", "En revisión", "قيد المراجعة", "समीक्षाधीन", "En cours d'examen", "Wird überprüft", "レビュー中", "Em revisão", "На проверке", "In revisione", "审核中"],
    ["timeline.feedbackProvided", "Timeline event", "Feedback Provided", "피드백 제공됨", "Retroalimentación proporcionada", "تم تقديم الملاحظات", "फीडबैक प्रदान किया गया", "Commentaires fournis", "Feedback gegeben", "フィードバック提供済み", "Feedback fornecido", "Отзыв предоставлен", "Feedback fornito", "已提供反馈"],
    ["timeline.approved", "Timeline event", "Approved for Publication", "출판 승인됨", "Aprobado para publicación", "موافق عليه للنشر", "प्रकाशन के लिए स्वीकृत", "Approuvé pour publication", "Zur Veröffentlichung freigegeben", "出版承認済み", "Aprovado para publicação", "Одобрено для публикации", "Approvato per pubblicazione", "已批准发布"],
    ["timeline.published", "Timeline event", "Published", "출판됨", "Publicado", "منشور", "प्रकाशित", "Publié", "Veröffentlicht", "公開済み", "Publicado", "Опубликовано", "Pubblicato", "已发布"],

    # Reviewer feedback
    ["feedback.from", "Feedback label", "Feedback from", "피드백 제공자", "Retroalimentación de", "ملاحظات من", "फीडबैक से", "Commentaires de", "Feedback von", "フィードバック元", "Feedback de", "Отзыв от", "Feedback da", "反馈来自"],
    ["feedback.reviewer", "Feedback label", "Reviewer", "검토자", "Revisor", "المراجع", "समीक्षक", "Réviseur", "Gutachter", "レビュアー", "Revisor", "Рецензент", "Revisore", "审核员"],
    ["feedback.suggestions", "Feedback label", "Suggestions", "제안 사항", "Sugerencias", "اقتراحات", "सुझाव", "Suggestions", "Vorschläge", "提案", "Sugestões", "Предложения", "Suggerimenti", "建议"],
    ["feedback.requestedChanges", "Feedback label", "Requested Changes", "요청된 변경 사항", "Cambios solicitados", "التغييرات المطلوبة", "अनुरोधित परिवर्तन", "Modifications demandées", "Angeforderte Änderungen", "要求された変更", "Mudanças solicitadas", "Запрошенные изменения", "Modifiche richieste", "请求的更改"],
    ["feedback.viewAll", "Feedback action", "View All Feedback", "모든 피드백 보기", "Ver todos los comentarios", "عرض جميع الملاحظات", "सभी फीडबैक देखें", "Voir tous les commentaires", "Alle Feedbacks anzeigen", "すべてのフィードバックを表示", "Ver todos os feedbacks", "Посмотреть все отзывы", "Visualizza tutti i feedback", "查看所有反馈"],

    # AI Review
    ["aiReview.title", "AI Review", "AI Review", "AI 검토", "Revisión de IA", "مراجعة الذكاء الاصطناعي", "एआई समीक्षा", "Examen IA", "KI-Überprüfung", "AIレビュー", "Revisão de IA", "Проверка ИИ", "Revisione IA", "AI审核"],
    ["aiReview.generating", "AI Review status", "Generating AI review...", "AI 검토 생성 중...", "Generando revisión de IA...", "جاري إنشاء مراجعة الذكاء الاصطناعي...", "एआई समीक्षा उत्पन्न हो रही है...", "Génération de l'examen IA...", "KI-Überprüfung wird erstellt...", "AIレビュー生成中...", "Gerando revisão de IA...", "Создание проверки ИИ...", "Generazione revisione IA...", "正在生成AI审核..."],
    ["aiReview.regenerate", "AI Review action", "Regenerate", "재생성", "Regenerar", "إعادة إنشاء", "पुन: उत्पन्न करें", "Régénérer", "Neu generieren", "再生成", "Regenerar", "Пересоздать", "Rigenera", "重新生成"],
    ["aiReview.strengths", "AI Review section", "Strengths", "강점", "Fortalezas", "نقاط القوة", "ताकत", "Forces", "Stärken", "強み", "Pontos fortes", "Сильные стороны", "Punti di forza", "优势"],
    ["aiReview.improvements", "AI Review section", "Suggested Improvements", "개선 제안", "Mejoras sugeridas", "التحسينات المقترحة", "सुझाए गए सुधार", "Améliorations suggérées", "Vorgeschlagene Verbesserungen", "改善提案", "Melhorias sugeridas", "Предлагаемые улучшения", "Miglioramenti suggeriti", "建议改进"],
    ["aiReview.overall", "AI Review section", "Overall Assessment", "전체 평가", "Evaluación general", "التقييم الشامل", "समग्र मूल्यांकन", "Évaluation globale", "Gesamtbewertung", "総合評価", "Avaliação geral", "Общая оценка", "Valutazione complessiva", "总体评估"],

    # Submission details
    ["submission.details", "Submission section", "Submission Details", "제출 세부 정보", "Detalles de envío", "تفاصيل التقديم", "सबमिशन विवरण", "Détails de soumission", "Einreichungsdetails", "提出詳細", "Detalhes da submissão", "Детали отправки", "Dettagli invio", "提交详情"],
    ["submission.lastUpdated", "Submission info", "Last updated", "마지막 업데이트", "Última actualización", "آخر تحديث", "अंतिम अपडेट", "Dernière mise à jour", "Zuletzt aktualisiert", "最終更新", "Última atualização", "Последнее обновление", "Ultimo aggiornamento", "最后更新"],
    ["submission.submittedAt", "Submission info", "Submitted at", "제출 시간", "Enviado en", "تم الإرسال في", "सबमिट किया गया", "Soumis à", "Eingereicht am", "提出日時", "Enviado em", "Отправлено", "Inviato il", "提交于"],
    ["submission.wordCount", "Submission info", "Word count", "단어 수", "Recuento de palabras", "عدد الكلمات", "शब्द गणना", "Nombre de mots", "Wortzahl", "単語数", "Contagem de palavras", "Количество слов", "Conteggio parole", "字数"],
    ["submission.readTime", "Submission info", "Estimated read time", "예상 읽기 시간", "Tiempo de lectura estimado", "وقت القراءة المقدر", "अनुमानित पढ़ने का समय", "Temps de lecture estimé", "Geschätzte Lesezeit", "推定読み時間", "Tempo estimado de leitura", "Расчетное время чтения", "Tempo di lettura stimato", "预计阅读时间"],
]

# Read existing CSV
existing_rows = []
with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    existing_rows = list(reader)

print(f"Current CSV has {len(existing_rows)} rows")

# Write back with new translations
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)

    # Write existing rows
    writer.writerows(existing_rows)

    # Append new translations
    writer.writerows(writer_dashboard_translations)

new_total = len(existing_rows) + len(writer_dashboard_translations)
print(f"Successfully added {len(writer_dashboard_translations)} translation keys to {output_file}")
print(f"Total rows: {new_total}")
