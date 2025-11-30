from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Folder, File, FolderShare, FileShare, Notification

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'bio')
        read_only_fields = ('id',)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class FolderShareSerializer(serializers.ModelSerializer):
    shared_with_email = serializers.EmailField(write_only=True)
    shared_with_details = UserSerializer(source='shared_with', read_only=True)

    class Meta:
        model = FolderShare
        fields = ('id', 'folder', 'shared_with', 'shared_with_email', 'shared_with_details', 'permission', 'expires_at', 'created_at')
        read_only_fields = ('id', 'created_at', 'shared_with')

    def create(self, validated_data):
        email = validated_data.pop('shared_with_email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        
        validated_data['shared_with'] = user
        return super().create(validated_data)

class FileShareSerializer(serializers.ModelSerializer):
    shared_with_email = serializers.EmailField(write_only=True)
    shared_with_details = UserSerializer(source='shared_with', read_only=True)

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_with', 'shared_with_email', 'shared_with_details', 'permission', 'expires_at', 'created_at')
        read_only_fields = ('id', 'created_at', 'shared_with')

    def create(self, validated_data):
        email = validated_data.pop('shared_with_email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        
        validated_data['shared_with'] = user
        return super().create(validated_data)

class FolderSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    shares = FolderShareSerializer(many=True, read_only=True)

    class Meta:
        model = Folder
        fields = ('id', 'name', 'color', 'tags', 'parent', 'owner', 'owner_details', 'created_at', 'shares')
        read_only_fields = ('id', 'owner', 'created_at')

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        folder = Folder.objects.create(**validated_data)
        folder.tags = tags
        folder.save()
        return folder

class FileSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    shares = FileShareSerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ('id', 'file', 'name', 'size', 'type', 'folder', 'owner', 'owner_details', 'description', 'tags', 'metadata', 'created_at', 'expiry_date', 'is_notarized', 'notarized_file', 'shares', 'file_url')
        read_only_fields = ('id', 'owner', 'created_at', 'size', 'type')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url)
        return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
