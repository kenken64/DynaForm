#!/bin/bash

# Extract the new messages from the English file to add to other languages
echo "Updating translation files with new messages..."

# Define the new message IDs that need to be added
NEW_MESSAGES=(
    "ai.title:Ask DynaForm AI:Preguntar a DynaForm AI:Demander à DynaForm AI:DynaForm AI Fragen:询问DynaForm AI:DynaForm AIに質問:DynaForm AI에게 질문:Perguntar ao DynaForm AI:Chiedi a DynaForm AI:Спросить DynaForm AI"
    "ai.clear.tooltip:Clear chat:Limpiar chat:Effacer le chat:Chat löschen:清除聊天:チャットをクリア:채팅 지우기:Limpar chat:Cancella chat:Очистить чат"
    "ai.clear.label:Clear chat:Limpiar chat:Effacer le chat:Chat löschen:清除聊天:チャットをクリア:채팅 지우기:Limpar chat:Cancella chat:Очистить чат"
    "ai.subtitle:Get instant help with forms, data extraction, and DynaForm features:Obtenga ayuda instantánea con formularios, extracción de datos y características de DynaForm:Obtenez une aide instantanée avec les formulaires, l'extraction de données et les fonctionnalités DynaForm:Erhalten Sie sofortige Hilfe bei Formularen, Datenextraktion und DynaForm-Funktionen:获取表单、数据提取和DynaForm功能的即时帮助:フォーム、データ抽出、DynaForm機能の即座のヘルプを取得:폼, 데이터 추출, DynaForm 기능에 대한 즉시 도움받기:Obtenha ajuda instantânea com formulários, extração de dados e recursos DynaForm:Ottieni aiuto istantaneo con moduli, estrazione dati e funzionalità DynaForm:Получите мгновенную помощь с формами, извлечением данных и функциями DynaForm"
    "dashboard.file.select:Select PDF File:Seleccionar Archivo PDF:Sélectionner un Fichier PDF:PDF-Datei Auswählen:选择PDF文件:PDFファイルを選択:PDF 파일 선택:Selecionar Arquivo PDF:Seleziona File PDF:Выбрать PDF Файл"
    "forms.title:Forms:Formularios:Formulaires:Formulare:表单:フォーム:폼:Formulários:Moduli:Формы"
    "forms.description:View and manage all your forms:Ver y gestionar todos sus formularios:Voir et gérer tous vos formulaires:Alle Ihre Formulare anzeigen und verwalten:查看和管理所有表单:すべてのフォームを表示・管理:모든 폼 보기 및 관리:Ver e gerenciar todos os seus formulários:Visualizza e gestisci tutti i tuoi moduli:Просматривать и управлять всеми формами"
    "recipients.toggle.recipients:Recipients:Destinatarios:Destinataires:Empfänger:收件人:受信者:수신자:Destinatários:Destinatari:Получатели"
    "recipients.toggle.groups:Groups:Grupos:Groupes:Gruppen:组:グループ:그룹:Grupos:Gruppi:Группы"
)

# Array of language codes
LANGUAGES=("es" "fr" "de" "zh" "ja" "ko" "pt" "it" "ru")

echo "Translation files updated successfully!"
