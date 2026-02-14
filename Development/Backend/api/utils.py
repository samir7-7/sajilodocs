import random
import string
from django.core.mail import send_mail
from django.conf import settings

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp):
    subject = 'Verify your email - SajiloDocs'
    message = f'Your verification code is: {otp}\n\nThis code will expire in 10 minutes.'
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [email]
    
    send_mail(subject, message, from_email, recipient_list)
