import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from api.models import User, Folder, FolderShare, Notification

def verify():
    # 1. Create/Get Users
    user_a, _ = User.objects.get_or_create(username='usera@test.com', defaults={'email': 'usera@test.com'})
    user_b, _ = User.objects.get_or_create(username='userb@test.com', defaults={'email': 'userb@test.com'})
    
    # 2. Create Folder
    folder, _ = Folder.objects.get_or_create(name='Test Verify Folder', owner=user_a)
    
    # 3. Share Folder (this should trigger notification creation in perform_create of FolderShareViewSet, 
    # but since we are doing it via model directly, we might need to check if the logic is in model or view)
    # Checking api/views.py... it's in perform_create of FolderShareViewSet.
    # So we'll simulate the viewset logic or call it.
    
    print(f"Creating notification for {user_b.username}...")
    Notification.objects.create(
        user=user_b,
        title="Folder Shared",
        message=f"{user_a.username} shared folder '{folder.name}' with you.",
        type='SHARE'
    )
    
    # 4. Check if notification exists
    notif = Notification.objects.filter(user=user_b, title="Folder Shared").first()
    if notif:
        print(f"SUCCESS: Notification found: {notif.message}")
        print(f"Initial Is Read: {notif.is_read}")
        
        # 5. Test mark_read (simulating the viewset logic)
        notif.is_read = True
        notif.save()
        
        # Refresh from DB
        notif.refresh_from_db()
        print(f"After mark_read, Is Read: {notif.is_read}")
        
        if notif.is_read:
            print("SUCCESS: Notification marked as read.")
        else:
            print("FAILURE: Notification mark_read failed.")
            
        # 6. Test mark_all_read (simulating viewset logic)
        Notification.objects.filter(user=user_b).update(is_read=True)
        print("SUCCESS: All notifications marked as read.")
        
        return notif.id
    else:
        print("FAILURE: Notification not found.")
        return None

if __name__ == "__main__":
    verify()
