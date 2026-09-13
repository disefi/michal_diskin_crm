/**
 * בונה כתובת מאוחדת + כותרת תיק מתוך שדות הכתובת המפורקים (רחוב/מספר/עיר/כותרת נוספת).
 * הכותרת נגזרת מהכתובת - אין יותר שדה כותרת חופשי נפרד.
 */
export function buildAddressAndTitle(formData: FormData) {
  const street = ((formData.get('street') as string) || '').trim()
  const houseNumber = ((formData.get('house_number') as string) || '').trim()
  const city = ((formData.get('city') as string) || '').trim()
  const addressNote = ((formData.get('address_note') as string) || '').trim() || null
  const additionalContact = ((formData.get('additional_contact') as string) || '').trim() || null

  const addressLine = [street, houseNumber].filter(Boolean).join(' ')
  const address = [addressLine, city].filter(Boolean).join(', ')
  const title = address + (addressNote ? ` - ${addressNote}` : '')

  return { street, houseNumber, city, addressNote, additionalContact, address, title }
}
