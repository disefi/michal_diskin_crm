'use client'
import { InputHTMLAttributes } from 'react'

/**
 * שדה מספר שמונע שינוי ערך בגלילת עכבר (wheel) כשהפוקוס עליו בטעות.
 */
export default function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="number"
      onWheel={(e) => e.currentTarget.blur()}
    />
  )
}
