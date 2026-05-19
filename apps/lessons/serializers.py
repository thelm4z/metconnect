from rest_framework import serializers
from .models import LessonSession


class LessonSessionSerializer(serializers.ModelSerializer):
    mentor_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = LessonSession
        fields = [
            'id', 'title', 'room_code', 'status', 'code_language',
            'mentor_name', 'student_name', 'created_at', 'started_at', 'ended_at',
        ]
        read_only_fields = [
            'room_code', 'status', 'mentor_name', 'student_name',
            'created_at', 'started_at', 'ended_at',
        ]

    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.username

    def get_student_name(self, obj):
        if obj.student:
            return obj.student.get_full_name() or obj.student.username
        return None


class LessonSessionDetailSerializer(serializers.ModelSerializer):
    mentor_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    mentor_id = serializers.IntegerField(source='mentor.id', read_only=True)
    student_id = serializers.SerializerMethodField()

    class Meta:
        model = LessonSession
        fields = [
            'id', 'title', 'room_code', 'status', 'code_language',
            'shared_notes', 'shared_code',
            'mentor_name', 'student_name', 'mentor_id', 'student_id',
            'created_at', 'started_at', 'ended_at',
        ]
        read_only_fields = [
            'room_code', 'status', 'mentor_id', 'student_id',
            'mentor_name', 'student_name', 'created_at', 'started_at', 'ended_at',
        ]

    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.username

    def get_student_name(self, obj):
        if obj.student:
            return obj.student.get_full_name() or obj.student.username
        return None

    def get_student_id(self, obj):
        return obj.student.id if obj.student else None
