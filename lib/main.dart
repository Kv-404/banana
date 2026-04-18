import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screen_share_service.dart';
import 'peerjs_client.dart';

// Note: flutter_webrtc handles MediaProjection permission and foreground
// service internally. We do NOT call native code for screen capture.

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF06070F),
  ));
  runApp(const MoodLensApp());
}

class MoodLensApp extends StatelessWidget {
  const MoodLensApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MoodLens',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF06070F),
        fontFamily: 'sans-serif',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E5C3),
          surface: Color(0xFF0D0E1A),
        ),
      ),
      home: const ScreenSharePage(),
    );
  }
}

class ScreenSharePage extends StatefulWidget {
  const ScreenSharePage({super.key});

  @override
  State<ScreenSharePage> createState() => _ScreenSharePageState();
}

class _ScreenSharePageState extends State<ScreenSharePage>
    with TickerProviderStateMixin {
  final _codeController = TextEditingController();
  final _screenShareService = ScreenShareService();
  PeerJsClient? _peerClient;

  String _status = 'Enter the code from your laptop';
  bool _isSharing = false;
  bool _isConnecting = false;
  Color _statusColor = const Color(0xFF5A5D7A);

  late AnimationController _pulseController;
  late AnimationController _glowController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(
      begin: 0.85,
      end: 1.15,
    ).animate(CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut));

    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _glowAnimation = Tween<double>(
      begin: 0.3,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _glowController, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _glowController.dispose();
    _codeController.dispose();
    _stopSharing();
    super.dispose();
  }

  void _updateStatus(String status, {Color? color}) {
    if (!mounted) return;
    setState(() {
      _status = status;
      _statusColor = color ?? const Color(0xFF5A5D7A);
    });
  }

  Future<void> _startSharing() async {
    final code = _codeController.text.trim().toUpperCase();
    if (code.length < 4) {
      _updateStatus('Enter the 4-character code from your laptop',
          color: const Color(0xFFFF9500));
      return;
    }

    setState(() => _isConnecting = true);
    _updateStatus('Requesting screen capture permission...');

    try {
      // Step 1: Request MediaProjection permission (native dialog)
      final granted = await _screenShareService.requestPermission();
      if (!granted) {
        _updateStatus('Permission denied', color: const Color(0xFFFF2D55));
        setState(() => _isConnecting = false);
        return;
      }

      // Step 2: Start foreground service (required by Android 14+)
      // The service only shows a notification — does NOT consume the token
      _updateStatus('Starting capture service...');
      await _screenShareService.startForegroundService();

      // Step 3: Start screen capture via flutter_webrtc
      // (flutter_webrtc creates the actual MediaProjection internally)
      _updateStatus('Capturing screen...');
      final stream = await _screenShareService.startCapture();

      // Step 4: Connect to host via PeerJS
      _updateStatus('Connecting to laptop...');
      _peerClient = PeerJsClient(
        onStatusChange: (status) => _updateStatus(
          status,
          color: status.contains('Live') || status.contains('🟢')
              ? const Color(0xFF00E5C3)
              : const Color(0xFF5A5D7A),
        ),
        onError: (error) {
          _updateStatus('Error: $error', color: const Color(0xFFFF2D55));
          _stopSharing();
        },
      );

      final hostPeerId = 'screencast-$code';
      await _peerClient!.callPeer(hostPeerId, stream);

      setState(() {
        _isSharing = true;
        _isConnecting = false;
      });
    } catch (e) {
      _updateStatus('Error: ${e.toString()}', color: const Color(0xFFFF2D55));
      setState(() => _isConnecting = false);
    }
  }

  Future<void> _stopSharing() async {
    await _peerClient?.disconnect();
    _peerClient = null;
    await _screenShareService.stopCapture();

    if (mounted) {
      setState(() {
        _isSharing = false;
        _isConnecting = false;
      });
      _updateStatus('Enter the code from your laptop');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF0A0B14),
              Color(0xFF06070F),
              Color(0xFF04050A),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  _buildLogo(),
                  const SizedBox(height: 8),
                  Text(
                    'Share your screen to your laptop',
                    style: TextStyle(
                      color: const Color(0xFF5A5D7A),
                      fontSize: 14,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Main card
                  _buildMainCard(),
                  const SizedBox(height: 24),

                  // Instructions
                  _buildInstructions(),
                  const SizedBox(height: 16),
                  Text(
                    'Works on Android 10+',
                    style: TextStyle(
                      color: const Color(0xFF5A5D7A).withValues(alpha: 0.5),
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'Mood',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: -0.5,
          ),
        ),
        Text(
          '.',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF00E5C3),
          ),
        ),
        Text(
          'Lens',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildMainCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF0D0E1A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _isSharing
              ? const Color(0xFF00E5C3).withValues(alpha: 0.3)
              : const Color(0xFFFFFFFF).withValues(alpha: 0.07),
        ),
        boxShadow: _isSharing
            ? [
                BoxShadow(
                  color: const Color(0xFF00E5C3).withValues(alpha: 0.08),
                  blurRadius: 40,
                  spreadRadius: -5,
                ),
              ]
            : null,
      ),
      child: Column(
        children: [
          // Code input or live badge
          if (!_isSharing) _buildCodeInput() else _buildLiveBadge(),
          const SizedBox(height: 28),

          // Action button
          _buildActionButton(),
          const SizedBox(height: 16),

          // Status text
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Text(
              _status,
              key: ValueKey(_status),
              style: TextStyle(
                color: _statusColor,
                fontSize: 12,
                fontFamily: 'monospace',
                letterSpacing: 0.5,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCodeInput() {
    return Column(
      children: [
        Text(
          'ENTER CODE FROM LAPTOP',
          style: TextStyle(
            color: const Color(0xFF5A5D7A),
            fontSize: 10,
            fontFamily: 'monospace',
            letterSpacing: 2,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF06070F),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFFFFFFF).withValues(alpha: 0.07),
            ),
          ),
          child: TextField(
            controller: _codeController,
            textAlign: TextAlign.center,
            maxLength: 4,
            style: const TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.w800,
              letterSpacing: 12,
              color: Color(0xFF00E5C3),
              fontFamily: 'monospace',
            ),
            decoration: InputDecoration(
              counterText: '',
              border: InputBorder.none,
              hintText: '• • • •',
              hintStyle: TextStyle(
                color: const Color(0xFF5A5D7A).withValues(alpha: 0.4),
                fontSize: 36,
                letterSpacing: 12,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
            ),
            textCapitalization: TextCapitalization.characters,
            inputFormatters: [
              UpperCaseTextFormatter(),
              FilteringTextInputFormatter.allow(RegExp('[A-Za-z0-9]')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLiveBadge() {
    return AnimatedBuilder(
      animation: _glowAnimation,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF00E5C3).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(
              color: Color.lerp(
                const Color(0xFF00E5C3).withValues(alpha: 0.2),
                const Color(0xFF00E5C3).withValues(alpha: 0.5),
                _glowAnimation.value,
              )!,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF00E5C3),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00E5C3).withValues(
                          alpha: _glowAnimation.value * 0.8),
                      blurRadius: 8,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'LIVE',
                style: TextStyle(
                  color: Color(0xFF00E5C3),
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActionButton() {
    return GestureDetector(
      onTap: _isConnecting ? null : (_isSharing ? _stopSharing : _startSharing),
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          final scale = _isSharing ? 1.0 : (_isConnecting ? 1.0 : 1.0);
          return Transform.scale(
            scale: scale,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Outer ripple (only when not sharing/connecting)
                if (!_isSharing && !_isConnecting)
                  AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, _) {
                      return Transform.scale(
                        scale: _pulseAnimation.value * 1.3,
                        child: Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFF00E5C3).withValues(
                                  alpha: (1.15 - _pulseAnimation.value) * 0.5),
                              width: 2,
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                // Main button
                Container(
                  width: 86,
                  height: 86,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isSharing
                        ? const Color(0xFFFF2D55).withValues(alpha: 0.12)
                        : _isConnecting
                            ? const Color(0xFFFF9500).withValues(alpha: 0.12)
                            : const Color(0xFF00E5C3).withValues(alpha: 0.08),
                    border: Border.all(
                      color: _isSharing
                          ? const Color(0xFFFF2D55)
                          : _isConnecting
                              ? const Color(0xFFFF9500)
                              : const Color(0xFF00E5C3),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: _isConnecting
                        ? SizedBox(
                            width: 30,
                            height: 30,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: const AlwaysStoppedAnimation(
                                Color(0xFFFF9500),
                              ),
                            ),
                          )
                        : Text(
                            _isSharing ? '⏹' : '📱',
                            style: const TextStyle(fontSize: 32),
                          ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInstructions() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0D0E1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFFFFFFF).withValues(alpha: 0.05),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'HOW TO USE',
            style: TextStyle(
              color: const Color(0xFF5A5D7A),
              fontSize: 10,
              fontFamily: 'monospace',
              letterSpacing: 2,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          _buildStep('1', 'Open mirror-omega-amber.vercel.app on laptop'),
          const SizedBox(height: 8),
          _buildStep('2', 'Enter the code shown on your laptop above'),
          const SizedBox(height: 8),
          _buildStep('3', 'Tap the button & allow screen capture'),
          const SizedBox(height: 8),
          _buildStep('4', 'Your screen will appear on the laptop'),
        ],
      ),
    );
  }

  Widget _buildStep(String num, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF00E5C3).withValues(alpha: 0.12),
          ),
          child: Center(
            child: Text(
              num,
              style: const TextStyle(
                color: Color(0xFF00E5C3),
                fontSize: 10,
                fontWeight: FontWeight.w700,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFFDDE0F0),
              fontSize: 12.5,
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }
}

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
