from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Folder, File, FolderShare, FileShare, Notification, OTPVerification
from .validators import ComplexityValidator

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'bio')
        read_only_fields = ('id',)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[ComplexityValidator().validate])

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'phone_number')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            is_active=True  # User is active immediately
        )
        return user

class FolderShareSerializer(serializers.ModelSerializer):
    shared_with_email = serializers.EmailField(write_only=True)
    shared_with_details = UserSerializer(source='shared_with', read_only=True)

    expires_at = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = FolderShare
        fields = ('id', 'folder', 'shared_with', 'shared_with_email', 'shared_with_details', 'permission', 'expires_at', 'message', 'created_at')
        read_only_fields = ('id', 'created_at', 'shared_with')

    def validate_expires_at(self, value):
        if value == "" or value == "undefined" or value is None:
            return None
        return value

    def to_internal_value(self, data):
        # Pre-process expires_at to handle empty string as None
        if 'expires_at' in data and data['expires_at'] == '':
            data = data.copy()
            data['expires_at'] = None
        return super().to_internal_value(data)

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

    expires_at = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_with', 'shared_with_email', 'shared_with_details', 'permission', 'expires_at', 'message', 'created_at')
        read_only_fields = ('id', 'created_at', 'shared_with')

    def validate_expires_at(self, value):
        if value == "" or value == "undefined" or value is None:
            return None
        return value

    def to_internal_value(self, data):
        # Pre-process expires_at to handle empty string as None
        if 'expires_at' in data and data['expires_at'] == '':
            data = data.copy()
            data['expires_at'] = None
        return super().to_internal_value(data)

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

    role = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ('id', 'name', 'color', 'tags', 'parent', 'owner', 'owner_details', 'created_at', 'updated_at', 'shares', 'role')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at', 'role')

    def get_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 'VIEW'
        if obj.owner == request.user:
            return 'OWNER'
        share = obj.shares.filter(shared_with=request.user).first()
        return share.permission if share else 'VIEW'

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

    role = serializers.SerializerMethodField()

    locked_by_details = UserSerializer(source='locked_by', read_only=True)

    class Meta:
        model = File
        fields = ('id', 'name', 'file', 'size', 'type', 'folder', 'owner', 'owner_details', 'description', 'tags', 'metadata', 'created_at', 'updated_at', 'status', 'role', 'file_url', 'shares', 'locked_by', 'locked_at', 'locked_by_details')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at', 'size', 'type', 'role', 'locked_by', 'locked_at')

    def get_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 'VIEW'
        if obj.owner == request.user:
            return 'OWNER'
        share = obj.shares.filter(shared_with=request.user).first()
        return share.permission if share else 'VIEW'

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url)
        return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
