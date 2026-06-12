export const INCOME_CATEGORIES = [
  { value: 'salvage_sale', label: 'Salvage Sale' },
  { value: 'order_fulfillment', label: 'Order Fulfillment' },
  { value: 'contract_payment', label: 'Contract Payment' },
  { value: 'other_income', label: 'Other Income' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'restock', label: 'Restock' },
  { value: 'ship_rental', label: 'Ship Rental' },
  { value: 'fees_fines', label: 'Fees & Fines' },
  { value: 'crew_pay', label: 'Crew Pay' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other_expense', label: 'Other Expense' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((c) => [c.value, c.label])
);