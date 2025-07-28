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
            'profile_picture_url': profile.profile_picture_url if profile else "",
            'bio': profile.bio if profile else "",
            'date_of_birth': profile.date_of_birth if profile else None,
            'gender': profile.gender if profile else "",
            'gender_display': profile.get_gender_display() if profile and profile.gender else "",
        })




class LogoutApi(APIView):
    def get(self, request, *args, **kwargs):
        logout(request)
        return JsonResponse({'message': 'Logged out successfully'}, status=200)


class UpdateUserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        profile = user.userprofile

        user.username = request.data.get("username", user.username)
        user.first_name = request.data.get("first_name", user.first_name)
        user.last_name = request.data.get("last_name", user.last_name)
        user.save()

        profile.phone_number = request.data.get("phone_number", profile.phone_number)
        profile.bio = request.data.get("bio", profile.bio)
        profile.gender = request.data.get("gender", profile.gender)
        
        # Handle date of birth
        date_of_birth = request.data.get("date_of_birth")
        if date_of_birth:
            profile.date_of_birth = date_of_birth

        # Handle profile picture upload
        if "profile_picture" in request.FILES:
            profile.profile_picture = request.FILES["profile_picture"]

        profile.save()

        # Return complete user data
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': profile.phone_number,
            'profile_picture_url': profile.profile_picture_url,
            'bio': profile.bio,
            'date_of_birth': profile.date_of_birth,
            'gender': profile.gender,
            'gender_display': profile.get_gender_display() if profile.gender else "",
        })




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