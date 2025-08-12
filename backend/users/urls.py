from django.urls import path
from .views import GoogleLoginApi,CurrentUserApi,LogoutApi,GetCSRFToken,ManualSignupView,ManualLoginView,UpdateUserProfile
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("login/google/", GoogleLoginApi.as_view(), name="google_login"),
    path("user/", CurrentUserApi.as_view(), name="current_user"),
    path('update-profile/', UpdateUserProfile.as_view()),
    path("logout/", LogoutApi.as_view(), name="logout"),
    path('csrf/', GetCSRFToken.as_view(), name='get-csrf'),
    path('manual-signup/', ManualSignupView.as_view(), name='manual-signup'),
    path('manual-login/', ManualLoginView.as_view(), name='manual-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # JWT refresh endpoint
]
