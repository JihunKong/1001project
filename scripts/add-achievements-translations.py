#!/usr/bin/env python3
import csv

input_file = '/Users/jihunkong/1001project/1001-stories/locales/translations.csv'
output_file = '/Users/jihunkong/1001project/1001-stories/locales/translations.csv'

# Achievement translation keys (6 achievements × 2 fields each = 12 keys)
achievements_translations = [
    # First Story
    ["achievements.firstStory.name", "Achievement name", "First Story", "첫 스토리", "Primera Historia", "القصة الأولى", "पहली कहानी", "Première Histoire", "Erste Geschichte", "最初のストーリー", "Primeira História", "Первая История", "Prima Storia", "第一个故事"],
    ["achievements.firstStory.description", "Achievement description", "Submit your first story to the platform", "플랫폼에 첫 번째 스토리를 제출하세요", "Envía tu primera historia a la plataforma", "أرسل قصتك الأولى إلى المنصة", "प्लेटफॉर्म पर अपनी पहली कहानी सबमिट करें", "Soumettez votre première histoire sur la plateforme", "Reichen Sie Ihre erste Geschichte auf der Plattform ein", "プラットフォームに最初のストーリーを提出する", "Envie sua primeira história para a plataforma", "Отправьте свою первую историю на платформу", "Invia la tua prima storia sulla piattaforma", "向平台提交您的第一个故事"],

    # Published Author
    ["achievements.publishedAuthor.name", "Achievement name", "Published Author", "출판된 작가", "Autor Publicado", "مؤلف منشور", "प्रकाशित लेखक", "Auteur Publié", "Veröffentlichter Autor", "出版作家", "Autor Publicado", "Опубликованный Автор", "Autore Pubblicato", "出版作者"],
    ["achievements.publishedAuthor.description", "Achievement description", "Have your first story published", "첫 번째 스토리를 출판하세요", "Ten tu primera historia publicada", "احصل على نشر قصتك الأولى", "अपनी पहली कहानी प्रकाशित करवाएं", "Faites publier votre première histoire", "Lassen Sie Ihre erste Geschichte veröffentlichen", "最初のストーリーを出版する", "Publique sua primeira história", "Опубликуйте свою первую историю", "Pubblica la tua prima storia", "发表您的第一个故事"],

    # Bestselling Writer
    ["achievements.bestsellingWriter.name", "Achievement name", "Bestselling Writer", "베스트셀러 작가", "Escritor Bestseller", "كاتب الأكثر مبيعاً", "बेस्टसेलिंग लेखक", "Auteur à Succès", "Bestsellerautor", "ベストセラー作家", "Escritor Bestseller", "Автор Бестселлеров", "Scrittore Bestseller", "畅销作家"],
    ["achievements.bestsellingWriter.description", "Achievement description", "Have 3 stories published", "3개의 스토리를 출판하세요", "Ten 3 historias publicadas", "احصل على نشر 3 قصص", "3 कहानियाँ प्रकाशित करवाएं", "Faites publier 3 histoires", "Lassen Sie 3 Geschichten veröffentlichen", "3つのストーリーを出版する", "Publique 3 histórias", "Опубликуйте 3 истории", "Pubblica 3 storie", "发表3个故事"],

    # Global Impact
    ["achievements.globalImpact.name", "Achievement name", "Global Impact", "글로벌 임팩트", "Impacto Global", "تأثير عالمي", "वैश्विक प्रभाव", "Impact Mondial", "Globale Wirkung", "グローバルインパクト", "Impacto Global", "Глобальное Влияние", "Impatto Globale", "全球影响力"],
    ["achievements.globalImpact.description", "Achievement description", "Reach 500+ readers worldwide", "전 세계 500명 이상의 독자에게 도달하세요", "Alcanza más de 500 lectores en todo el mundo", "الوصول إلى أكثر من 500 قارئ حول العالم", "दुनिया भर में 500+ पाठकों तक पहुंचें", "Atteignez plus de 500 lecteurs dans le monde", "Erreichen Sie weltweit über 500 Leser", "世界中で500人以上の読者に届ける", "Alcance mais de 500 leitores em todo o mundo", "Достигните 500+ читателей по всему миру", "Raggiungi oltre 500 lettori in tutto il mondo", "全球覆盖500+读者"],

    # Prolific Writer
    ["achievements.prolificWriter.name", "Achievement name", "Prolific Writer", "다작 작가", "Escritor Prolífico", "كاتب غزير الإنتاج", "प्रतिभावान लेखक", "Écrivain Prolifique", "Produktiver Autor", "多作な作家", "Escritor Prolífico", "Плодовитый Писатель", "Scrittore Prolifico", "多产作家"],
    ["achievements.prolificWriter.description", "Achievement description", "Submit 5 or more stories", "5개 이상의 스토리를 제출하세요", "Envía 5 o más historias", "أرسل 5 قصص أو أكثر", "5 या अधिक कहानियाँ सबमिट करें", "Soumettez 5 histoires ou plus", "Reichen Sie 5 oder mehr Geschichten ein", "5つ以上のストーリーを提出する", "Envie 5 ou mais histórias", "Отправьте 5 или более историй", "Invia 5 o più storie", "提交5个或更多故事"],

    # Consistent Contributor
    ["achievements.consistentContributor.name", "Achievement name", "Consistent Contributor", "꾸준한 기여자", "Contribuidor Constante", "مساهم متسق", "नियमित योगदानकर्ता", "Contributeur Régulier", "Konstanter Mitwirkender", "一貫した貢献者", "Contribuidor Consistente", "Постоянный Участник", "Contributore Costante", "持续贡献者"],
    ["achievements.consistentContributor.description", "Achievement description", "Active in the last 30 days", "지난 30일 동안 활동", "Activo en los últimos 30 días", "نشط في آخر 30 يوماً", "पिछले 30 दिनों में सक्रिय", "Actif au cours des 30 derniers jours", "Aktiv in den letzten 30 Tagen", "過去30日間アクティブ", "Ativo nos últimos 30 dias", "Активен за последние 30 дней", "Attivo negli ultimi 30 giorni", "过去30天内活跃"],
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
    writer.writerows(achievements_translations)

new_total = len(existing_rows) + len(achievements_translations)
print(f"Successfully added {len(achievements_translations)} achievement translation keys to {output_file}")
print(f"Total rows: {new_total}")
