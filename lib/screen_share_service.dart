import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

/// Bridge between Flutter and native Android MediaProjection API.
///
/// Android 14+ requires this strict order:
/// 1. Request MediaProjection permission (native dialog)
/// 2. Start foreground service with mediaProjection type
/// 3. THEN call getDisplayMedia() (flutter_webrtc creates the actual projection)
///
/// IMPORTANT: The foreground service must NOT create its own MediaProjection
/// from the token — that would consume it and prevent flutter_webrtc from
/// using it, causing a crash.
class ScreenShareService {
  static const _channel = MethodChannel('com.example.hua/screen_capture');

  bool _isCapturing = false;
  MediaStream? _screenStream;
  int? _resultCode;

  bool get isCapturing => _isCapturing;
  MediaStream? get screenStream => _screenStream;

  /// Request screen capture permission from the user.
  /// Shows the native Android MediaProjection permission dialog.
  /// Returns true if permission was granted.
  Future<bool> requestPermission() async {
    try {
      final result = await _channel.invokeMethod<Map>('requestScreenCapture');
      if (result != null && result['granted'] == true) {
        _resultCode = result['resultCode'] as int?;
        return true;
      }
      return false;
    } on PlatformException catch (e) {
      throw Exception('Failed to request screen capture: ${e.message}');
    }
  }

  /// Start the foreground service (required by Android 14+).
  /// This ONLY shows a notification — it does NOT create the MediaProjection.
  Future<void> startForegroundService() async {
    try {
      await _channel.invokeMethod('startForegroundService');
    } on PlatformException catch (e) {
      throw Exception('Failed to start foreground service: ${e.message}');
    }
  }

  /// Start screen capture and return the MediaStream.
  /// Must be called AFTER requestPermission() and startForegroundService().
  /// flutter_webrtc handles the actual MediaProjection creation internally.
  Future<MediaStream> startCapture() async {
    final mediaConstraints = <String, dynamic>{
      'audio': false,
      'video': {
        'deviceId': 'screen',
        'mandatory': {
          'minWidth': '720',
          'minHeight': '1280',
          'minFrameRate': '10',
          'maxFrameRate': '15',
        },
      },
    };

    try {
      _screenStream = await navigator.mediaDevices.getDisplayMedia(
        mediaConstraints,
      );
      _isCapturing = true;

      // Listen for track ended (user stopped sharing via system UI)
      if (_screenStream!.getVideoTracks().isNotEmpty) {
        _screenStream!.getVideoTracks().first.onEnded = () {
          stopCapture();
        };
      }

      return _screenStream!;
    } catch (e) {
      throw Exception('Failed to start screen capture: $e');
    }
  }

  /// Stop screen capture and foreground service.
  Future<void> stopCapture() async {
    _isCapturing = false;
    if (_screenStream != null) {
      for (final track in _screenStream!.getTracks()) {
        await track.stop();
      }
      await _screenStream!.dispose();
      _screenStream = null;
    }
    try {
      await _channel.invokeMethod('stopForegroundService');
    } catch (_) {
      // Service might already be stopped
    }
  }
}
