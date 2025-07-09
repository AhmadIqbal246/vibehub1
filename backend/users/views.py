from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from .serializers import AuthSerializer
from .services import get_user_data
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import logout
from django.http import JsonResponse
from .serializers import PhoneNumberSerializer
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from .models import UserProfile
from .serializers import ManualSignupSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt,ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny



class GoogleLoginApi(APIView):
    def get(self, request, *args, **kwargs):
        auth_serializer = AuthSerializer(data=request.GET)
        auth_serializer.is_valid(raise_exception=True)

        validated_data = auth_serializer.validated_data
        data = get_user_data(validated_data)

        user = data['user']
        login(request, user)

        return redirect("http://localhost:5173/profile?logged_in=google")



class CurrentUserApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.userprofile  # Assuming you have a related UserProfile model
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': profile.phone_number if profile else "",
        })




class LogoutApi(APIView):
    def get(self, request, *args, **kwargs):
        logout(request)
        return JsonResponse({'message': 'Logged out successfully'}, status=200)


class UpdateUserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data
        username = request.data.get("username")
        phone = request.data.get("phone_number")

        user.username = username or user.username
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.save()

        profile = user.userprofile
        profile.phone_number = phone or profile.phone_number
        profile.save()

        return Response({'message': 'Profile updated'})



@method_decorator(ensure_csrf_cookie, name='dispatch')
class GetCSRFToken(APIView):
    def get(self, request):
        return Response({'message': 'CSRF cookie set'})
    

@method_decorator(csrf_exempt, name='dispatch')  # optional
class ManualSignupView(APIView):
    authentication_classes = []  # ✅ No CSRF check
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ManualSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)
            return Response({'message': 'Signup successful'})
        return Response(serializer.errors, status=400)
    


@method_decorator(csrf_protect, name='dispatch')  # ✅ Use csrf_protect instead of csrf_exempt
class ManualLoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User with this email does not exist.'}, status=400)

        user = authenticate(request, username=user.username, password=password)

        if user is not None:
            login(request, user)
            return Response({'message': 'Login successful'})
        else:
            return Response({'detail': 'Invalid password'}, status=400)