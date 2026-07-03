import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';

class PickedContact {
  const PickedContact({required this.name, required this.phone});

  final String name;
  final String phone;
}

class ContactPickerUtil {
  ContactPickerUtil._();

  static Future<PickedContact?> pickFromDevice() async {
    final granted = await FlutterContacts.requestPermission(readonly: true);
    if (!granted) return null;

    final contact = await FlutterContacts.openExternalPick();
    if (contact == null) return null;

    final name = contact.displayName.trim();
    final phone = _firstPhone(contact);
    if (name.isEmpty && phone.isEmpty) return null;

    return PickedContact(
      name: name,
      phone: phone,
    );
  }

  static String _firstPhone(Contact contact) {
    if (contact.phones.isEmpty) return '';
    final raw = contact.phones.first.number;
    return Validators.normalizePhone(raw.replaceAll(RegExp(r'[^\d+]'), ''));
  }
}
