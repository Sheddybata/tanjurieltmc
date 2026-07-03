import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// PIN entry with visibility toggle — avoids InputDecoration suffix overflow.
class PinTextField extends StatefulWidget {
  const PinTextField({
    super.key,
    required this.controller,
    this.label,
    this.validator,
    this.maxLength = 6,
  });

  final TextEditingController controller;
  final String? label;
  final String? Function(String?)? validator;
  final int maxLength;

  @override
  State<PinTextField> createState() => _PinTextFieldState();
}

class _PinTextFieldState extends State<PinTextField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Row(
            children: [
              Expanded(
                child: Text(widget.label!, style: Theme.of(context).textTheme.titleSmall),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                tooltip: _obscure ? 'Show PIN' : 'Hide PIN',
                icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ],
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: widget.controller,
          validator: widget.validator,
          obscureText: _obscure,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(widget.maxLength),
          ],
          decoration: const InputDecoration(hintText: 'Enter PIN'),
        ),
      ],
    );
  }
}
