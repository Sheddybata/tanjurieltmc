import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';

class PinInputField extends StatefulWidget {
  const PinInputField({
    super.key,
    required this.onCompleted,
    this.length = AppConstants.pinLength,
    this.minLength,
    this.obscure = true,
  });

  final ValueChanged<String> onCompleted;
  final int length;
  final int? minLength;
  final bool obscure;

  int get _minLength => minLength ?? length;

  @override
  State<PinInputField> createState() => _PinInputFieldState();
}

class _PinInputFieldState extends State<PinInputField> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 8.0;
        final available = constraints.maxWidth;
        final boxSize = ((available - gap * (widget.length - 1)) / widget.length).clamp(36.0, 48.0);

        return Column(
          children: [
            GestureDetector(
              onTap: () => _focusNode.requestFocus(),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(widget.length, (index) {
                  final filled = index < _controller.text.length;
                  return Container(
                    margin: EdgeInsets.only(right: index < widget.length - 1 ? gap : 0),
                    width: boxSize,
                    height: boxSize * 1.15,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: filled ? AppColors.primary : AppColors.border,
                        width: filled ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      color: AppColors.surface,
                    ),
                    alignment: Alignment.center,
                    child: filled
                        ? Text(
                            widget.obscure ? '•' : _controller.text[index],
                            style: Theme.of(context).textTheme.headlineSmall,
                          )
                        : null,
                  );
                }),
              ),
            ),
            Opacity(
              opacity: 0,
              child: SizedBox(
                height: 0,
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  keyboardType: TextInputType.number,
                  maxLength: widget.length,
                  autofocus: true,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onChanged: (value) {
                    setState(() {});
                    if (value.length >= widget._minLength) {
                      widget.onCompleted(value);
                    }
                  },
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
