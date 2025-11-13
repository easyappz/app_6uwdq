from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from .serializers import MessageSerializer


class HelloView(APIView):
    """
    A simple API endpoint that returns a greeting message.
    """

    @extend_schema(
        responses={200: MessageSerializer}, description="Get a hello world message"
    )
    def get(self, request):
        payload = {"message": "Hello!", "timestamp": timezone.now()}
        serializer = MessageSerializer(instance=payload)
        return Response(serializer.data)
