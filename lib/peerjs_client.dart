import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

/// Implements the PeerJS signaling protocol over WebSocket
/// to connect to the PeerJS cloud server and establish WebRTC calls.
///
/// This implementation matches the exact wire format used by PeerJS v1.5.x
/// (see https://github.com/peers/peerjs/blob/master/lib/negotiator.ts)
class PeerJsClient {
  static const String _peerServer = 'wss://0.peerjs.com/peerjs';
  static const String _peerKey = 'peerjs';

  WebSocketChannel? _ws;
  String? _peerId;
  String? _token;
  RTCPeerConnection? _pc;
  MediaStream? _localStream;
  bool _connected = false;
  Timer? _heartbeat;
  String? _connectionId;

  final void Function(String status)? onStatusChange;
  final void Function(String error)? onError;

  PeerJsClient({this.onStatusChange, this.onError});

  bool get isConnected => _connected;
  String? get peerId => _peerId;

  /// Generate a random peer ID (matching PeerJS format)
  String _generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final rng = Random();
    return List.generate(16, (_) => chars[rng.nextInt(chars.length)]).join();
  }

  /// Generate a random token (matching PeerJS format)
  String _generateToken() {
    final rng = Random();
    return List.generate(20, (_) => rng.nextInt(36).toRadixString(36)).join();
  }

  /// Connect to PeerJS server and call the host peer
  Future<void> callPeer(String hostPeerId, MediaStream stream) async {
    _localStream = stream;
    _peerId = _generateId();
    _token = _generateToken();
    // PeerJS uses mc_ prefix for media connections + a random token
    _connectionId = 'mc_${_generateToken()}';

    onStatusChange?.call('Connecting to signaling server...');

    // Connect WebSocket
    final uri = Uri.parse(
      '$_peerServer?key=$_peerKey&id=$_peerId&token=$_token',
    );

    try {
      _ws = WebSocketChannel.connect(uri);
      await _ws!.ready;
    } catch (e) {
      onError?.call('Failed to connect to signaling server: $e');
      return;
    }

    _ws!.stream.listen(
      _handleMessage,
      onError: (e) {
        onError?.call('WebSocket error: $e');
        _cleanup();
      },
      onDone: () {
        if (_connected) {
          onStatusChange?.call('Disconnected from server');
          _cleanup();
        }
      },
    );

    // Wait for OPEN message, then initiate call
    _pendingHostId = hostPeerId;
  }

  String? _pendingHostId;

  void _handleMessage(dynamic data) {
    try {
      final msg = jsonDecode(data as String);
      final type = msg['type'] as String?;

      switch (type) {
        case 'OPEN':
          _connected = true;
          onStatusChange?.call('Connected to server, initiating call...');
          // Start heartbeat
          _heartbeat = Timer.periodic(const Duration(seconds: 15), (_) {
            _sendHeartbeat();
          });
          // Now create offer and call
          if (_pendingHostId != null) {
            _initiateCall(_pendingHostId!);
          }
          break;

        case 'ANSWER':
          _handleAnswer(msg['payload']);
          break;

        case 'CANDIDATE':
          _handleCandidate(msg['payload']);
          break;

        case 'ERROR':
          onError?.call('Server error: ${msg['payload']?['msg'] ?? 'Unknown'}');
          break;

        case 'EXPIRE':
          onError?.call('Connection expired');
          _cleanup();
          break;

        default:
          break;
      }
    } catch (e) {
      // Ignore non-JSON messages (like heartbeat responses)
    }
  }

  void _sendHeartbeat() {
    try {
      _ws?.sink.add(jsonEncode({'type': 'HEARTBEAT'}));
    } catch (_) {}
  }

  Future<void> _initiateCall(String hostPeerId) async {
    onStatusChange?.call('Creating WebRTC connection...');

    // Create peer connection with STUN + TURN for cross-network
    final config = <String, dynamic>{
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun1.l.google.com:19302'},
        {
          'urls': 'turn:a.relay.metered.ca:80',
          'username': 'e8dd65b92f6dfe16a4e1d872',
          'credential': 'uWdDpYSJCMlP/Fn8',
        },
        {
          'urls': 'turn:a.relay.metered.ca:443',
          'username': 'e8dd65b92f6dfe16a4e1d872',
          'credential': 'uWdDpYSJCMlP/Fn8',
        },
        {
          'urls': 'turn:a.relay.metered.ca:443?transport=tcp',
          'username': 'e8dd65b92f6dfe16a4e1d872',
          'credential': 'uWdDpYSJCMlP/Fn8',
        },
      ],
      'sdpSemantics': 'unified-plan',
    };

    _pc = await createPeerConnection(config);

    // Add local stream tracks
    if (_localStream != null) {
      for (final track in _localStream!.getTracks()) {
        await _pc!.addTrack(track, _localStream!);
      }
    }

    // Handle ICE candidates — PeerJS format from negotiator.ts lines 83-91
    _pc!.onIceCandidate = (RTCIceCandidate candidate) {
      if (candidate.candidate == null || candidate.candidate!.isEmpty) return;

      _sendSignal('CANDIDATE', hostPeerId, {
        'candidate': {
          'candidate': candidate.candidate,
          'sdpMLineIndex': candidate.sdpMLineIndex,
          'sdpMid': candidate.sdpMid,
        },
        'type': 'media',
        'connectionId': _connectionId,
      });
    };

    _pc!.onIceConnectionState = (RTCIceConnectionState state) {
      switch (state) {
        case RTCIceConnectionState.RTCIceConnectionStateConnected:
          onStatusChange?.call('Stream connected! Sharing live.');
          break;
        case RTCIceConnectionState.RTCIceConnectionStateFailed:
          onError?.call('Connection failed');
          break;
        case RTCIceConnectionState.RTCIceConnectionStateDisconnected:
          onStatusChange?.call('Connection interrupted...');
          break;
        case RTCIceConnectionState.RTCIceConnectionStateClosed:
          onStatusChange?.call('Connection closed');
          break;
        default:
          break;
      }
    };

    _pc!.onConnectionState = (RTCPeerConnectionState state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        onStatusChange?.call('🟢 Live — streaming to laptop');
      }
    };

    // Create offer
    final offer = await _pc!.createOffer({
      'offerToReceiveAudio': false,
      'offerToReceiveVideo': false,
    });
    await _pc!.setLocalDescription(offer);

    onStatusChange?.call('Sending offer to host...');

    // Send offer via PeerJS signaling
    // PeerJS format from negotiator.ts lines 226-231:
    // payload = { sdp: offer, type: connectionType, connectionId, metadata }
    // where offer is the RTCSessionDescription {type: "offer", sdp: "v=0..."}
    _sendSignal('OFFER', hostPeerId, {
      'sdp': {
        'type': offer.type,
        'sdp': offer.sdp,
      },
      'type': 'media',
      'connectionId': _connectionId,
      'metadata': null,
    });
  }

  void _sendSignal(String type, String dst, Map<String, dynamic> payload) {
    final msg = jsonEncode({
      'type': type,
      'payload': payload,
      'dst': dst,
      'src': _peerId,
    });
    _ws?.sink.add(msg);
  }

  Future<void> _handleAnswer(Map<String, dynamic>? payload) async {
    if (payload == null || _pc == null) return;

    final sdp = payload['sdp'];
    if (sdp != null) {
      onStatusChange?.call('Received answer, connecting...');
      final description = RTCSessionDescription(
        sdp['sdp'] as String?,
        sdp['type'] as String?,
      );
      await _pc!.setRemoteDescription(description);
    }
  }

  Future<void> _handleCandidate(Map<String, dynamic>? payload) async {
    if (payload == null || _pc == null) return;

    final candidateData = payload['candidate'];
    if (candidateData != null) {
      final candidate = RTCIceCandidate(
        candidateData['candidate'] as String?,
        candidateData['sdpMid'] as String?,
        candidateData['sdpMLineIndex'] as int?,
      );
      await _pc!.addCandidate(candidate);
    }
  }

  Future<void> disconnect() async {
    _cleanup();
  }

  void _cleanup() {
    _connected = false;
    _heartbeat?.cancel();
    _heartbeat = null;
    _pc?.close();
    _pc = null;
    _ws?.sink.close();
    _ws = null;
    _localStream = null;
    _pendingHostId = null;
    _connectionId = null;
  }
}
