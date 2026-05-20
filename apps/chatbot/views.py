from google import genai
from google.genai import types
from decouple import config
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

SYSTEM_PROMPT = """Sen Mentonnect platformunun yardımcı asistanısın. Mentonnect, öğrencileri alanında uzman mentorlarla buluşturan bir platformdur.

Platform hakkında bilmen gerekenler:
- Kullanıcılar öğrenci veya mentor olarak kayıt olabilir
- Mentorlar profillerinde biyografi, deneyim yılı ve uzmanlık etiketleri paylaşır
- Öğrenciler mentorlara mesaj gönderebilir ve yorum yapabilir
- Mentorlar "Doğrulanmış Mentor" rozeti alabilir
- Kayıt olmak ücretsizdir

Görevin:
- Kullanıcıların Mentonnect'i daha iyi anlamalarına yardımcı olmak
- Mentor bulmak, kayıt olmak veya platform kullanımı hakkında sorularını yanıtlamak
- Türkçe konuşmak ve samimi, yardımsever bir dil kullanmak
- Eğer soru platformun dışındaysa kibarca konu dışı olduğunu belirt

Kısa ve net yanıtlar ver. Gerekmedikçe uzun açıklamalar yapma."""


class ChatView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])

        if not message:
            return Response({'error': 'Mesaj boş olamaz.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(message) > 1000:
            return Response({'error': 'Mesaj çok uzun.'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = config('GEMINI_API_KEY', default=None)
        if not api_key:
            return Response(
                {'error': 'Chatbot şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Conversation history: role 'user' veya 'model'
        gemini_history = []
        for item in history[-10:]:
            role = item.get('role')
            content = item.get('content', '')
            if role == 'user' and content:
                gemini_history.append(types.Content(role='user', parts=[types.Part(text=content)]))
            elif role == 'assistant' and content:
                gemini_history.append(types.Content(role='model', parts=[types.Part(text=content)]))

        MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
        last_error = None

        for model_name in MODELS:
            try:
                client = genai.Client(api_key=api_key)
                chat = client.chats.create(
                    model=model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        max_output_tokens=512,
                    ),
                    history=gemini_history,
                )
                response = chat.send_message(message)
                reply = response.text
                return Response({'reply': reply})
            except Exception as e:
                last_error = str(e)
                if '403' in last_error or 'API key' in last_error or 'PERMISSION_DENIED' in last_error:
                    # API anahtarı sorunu → diğer modeli denemeye gerek yok
                    break
                continue

        if last_error and ('API key' in last_error or '403' in last_error or 'PERMISSION_DENIED' in last_error):
            return Response(
                {'error': 'API anahtarı geçersiz veya süresi dolmuş. Lütfen yöneticiyle iletişime geçin.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {'error': 'Asistan şu an yanıt veremiyor. Lütfen tekrar deneyin.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
